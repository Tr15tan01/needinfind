import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateJson, generateText } from "@/lib/services/gemini";
import { assistantTurnSchema, fallbackAskTurn, type AssistantTurn } from "@/lib/schemas/requirements";
import { searchProducts, type ExtractedRequirements } from "@/lib/services/product-search";
import type { FeaturedProduct } from "@/lib/services/catalog";
import { recordEvent } from "@/lib/services/analytics";

export type AssistantIdentity = { userId: string | null; guestToken: string | null };

export type AssistantReply = {
  conversationId: string;
  reply: string;
  products: FeaturedProduct[];
};

const UNAVAILABLE_MESSAGE =
  "The AI assistant is temporarily unavailable. You can still browse our products and comparisons while we restore the service.";

async function loadOrCreateConversation(conversationId: string | null, identity: AssistantIdentity) {
  if (conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (existing) return { conversation: existing, isNew: false };
  }

  const conversation = await prisma.conversation.create({
    data: { userId: identity.userId, guestToken: identity.guestToken },
    include: { messages: true }
  });
  return { conversation, isNew: true };
}

async function getCatalogCategoryList() {
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    select: { name: true, slug: true, parentId: true }
  });
  return categories.map((c: { name: string; slug: string; parentId: string | null }) => `${c.slug} (${c.name})`).join(", ");
}

function buildTurnPrompt(params: {
  categoryList: string;
  history: { role: string; content: string }[];
  storedRequirements: ExtractedRequirements;
  userMessage: string;
}) {
  const historyText = params.history
    .map((m) => `${m.role === "USER" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `You are a shopping adviser for an online catalog called NeedInFind. You help a user figure out what product they need, then hand off to a separate deterministic search system — you never invent products, prices, or specifications yourself.

Available category slugs in the catalog: ${params.categoryList || "(none configured yet)"}

Requirements gathered so far (may be incomplete): ${JSON.stringify(params.storedRequirements)}

Conversation so far:
${historyText || "(this is the first message)"}

Latest user message: "${params.userMessage}"

Decide one of two actions:
- "ask": you need more information before a search would be useful (e.g. budget, use case, a key preference). Ask exactly one clear, short question.
- "recommend": you have enough to search now (at minimum, a category guess).

Respond with ONLY a JSON object, no other text, matching exactly this shape:
{
  "action": "ask" | "recommend",
  "question": string or null (required if action is "ask", otherwise null),
  "requirements": {
    "categorySlug": one of the category slugs above that best fits, or null,
    "budgetMax": a number (max budget in USD) if mentioned, or null,
    "keywords": an array of a few specific keywords from what the user said (e.g. product type, brand, key feature), or [],
    "notes": a short free-text note capturing anything else relevant, or null
  }
}`;
}

function buildExplanationPrompt(products: FeaturedProduct[], requirements: ExtractedRequirements) {
  const productList = products
    .map(
      (p, i) =>
        `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ""} — ${
          p.lowestPrice ? `from ${p.currency} ${p.lowestPrice}` : "price varies by retailer"
        }${p.shortDescription ? ` — ${p.shortDescription}` : ""}`
    )
    .join("\n");

  return `You are a shopping adviser. Based on these requirements: ${JSON.stringify(requirements)}, here are the ONLY real products found in the catalog:

${productList}

Write a short, honest 2-4 sentence recommendation referencing ONLY the products listed above by name. Mention relevant tradeoffs if there's more than one option. Do not mention any product, spec, or price that isn't listed above. Do not invent anything. Plain text only, no markdown.`;
}

export async function handleAssistantMessage(
  conversationId: string | null,
  userMessage: string,
  identity: AssistantIdentity
): Promise<AssistantReply> {
  const { conversation, isNew } = await loadOrCreateConversation(conversationId, identity);
  const storedRequirements = (conversation.requirements as ExtractedRequirements | null) ?? {};

  if (isNew) {
    recordEvent("AI_CONVERSATION_STARTED", identity, { conversationId: conversation.id });
  }
  recordEvent("AI_MESSAGE", identity, { conversationId: conversation.id });

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: userMessage }
  });

  let turn: AssistantTurn;
  try {
    const categoryList = await getCatalogCategoryList();
    const prompt = buildTurnPrompt({
      categoryList,
      history: conversation.messages,
      storedRequirements,
      userMessage
    });
    const raw = await generateJson(prompt);
    const parsed = assistantTurnSchema.safeParse(raw);
    turn = parsed.success ? parsed.data : fallbackAskTurn;
    if (!parsed.success) {
      console.error("Assistant turn failed validation:", parsed.error.flatten());
    }
  } catch (error) {
    console.error("Gemini turn call failed:", error);
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: UNAVAILABLE_MESSAGE }
    });
    return { conversationId: conversation.id, reply: UNAVAILABLE_MESSAGE, products: [] };
  }

  const mergedRequirements: ExtractedRequirements = {
    categorySlug: turn.requirements.categorySlug ?? storedRequirements.categorySlug ?? null,
    budgetMax: turn.requirements.budgetMax ?? storedRequirements.budgetMax ?? null,
    keywords: turn.requirements.keywords?.length ? turn.requirements.keywords : storedRequirements.keywords ?? [],
    notes: turn.requirements.notes ?? storedRequirements.notes ?? null
  };

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { requirements: mergedRequirements as Prisma.InputJsonValue }
  });

  if (turn.action === "ask") {
    const question = turn.question ?? fallbackAskTurn.question!;
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: question }
    });
    return { conversationId: conversation.id, reply: question, products: [] };
  }

  // action === "recommend" — hand off to the deterministic matcher. Gemini
  // never sees or influences which rows come back from here.
  const { products, matchedCategoryName } = await searchProducts(mergedRequirements);

  if (products.length === 0) {
    // Per spec §42: tell the user honestly rather than inventing a product.
    const reply = matchedCategoryName
      ? `I couldn't find a published product in ${matchedCategoryName} matching that yet — our catalog is still growing. You're welcome to browse the category directly, or tell me more and I'll keep looking.`
      : "I couldn't find a matching product in our catalog yet. Could you tell me a bit more, or try browsing our categories directly?";
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: reply }
    });
    return { conversationId: conversation.id, reply, products: [] };
  }

  let explanation: string;
  try {
    explanation = await generateText(buildExplanationPrompt(products, mergedRequirements));
  } catch (error) {
    console.error("Gemini explanation call failed:", error);
    // Fails soft into a deterministic sentence built from real data only —
    // still grounded, just less conversational.
    explanation = `Here's what matches best: ${products.map((p) => p.name).join(", ")}.`;
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: explanation,
      metadata: { productIds: products.map((p) => p.id) }
    }
  });

  return { conversationId: conversation.id, reply: explanation, products };
}
