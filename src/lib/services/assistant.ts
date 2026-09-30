import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateJson, generateText } from "@/lib/services/gemini";
import { assistantTurnSchema, fallbackAskTurn, type AssistantTurn } from "@/lib/schemas/requirements";
import { searchProducts, type ExtractedRequirements, type MatchType } from "@/lib/services/product-search";
import type { FeaturedProduct } from "@/lib/services/catalog";
import { recordEvent } from "@/lib/services/analytics";
import { normalizeKeywords } from "@/lib/services/product-scoring";

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

  return `You are a shopping adviser for an online catalog called NeedInFind. You help a user find the right product, then hand off to a separate deterministic search system — you never invent products, prices, or specifications yourself.

Available category slugs in the catalog: ${params.categoryList || "(none configured yet)"}

Requirements gathered so far (may be incomplete): ${JSON.stringify(params.storedRequirements)}

Conversation so far:
${historyText || "(this is the first message)"}

Latest user message: "${params.userMessage}"

Decide one of two actions:
- "recommend" (the DEFAULT): use this whenever you can tell what kind of product or task the user means — even if budget, brand or other details are unknown. Showing real options first is more helpful than questioning the user. Examples that must be "recommend": "I need a business laptop", "I am going to hang a picture on the wall", "something to cut wood", "a good blender".
- "ask": ONLY when the message is so vague that no product type can be guessed at all (e.g. "hi", "help me", "I need something"). Never ask about budget or preferences before showing products.

When recommending you MAY add one short optional "followUp" question that would help narrow things down next time (e.g. "Do you have a budget in mind?"). Leave it null if the user already gave enough detail. Never ask about something the user already told you.

Rules for requirements:
- categorySlug: the single best-fitting slug from the list above, or null if none fits.
- budgetMax: a plain number in USD if the user mentioned a price limit or target ("under $800", "around 1000", "max 500"), otherwise keep null. Once the user gives a price, it applies.
- keywords: 3-8 short search words. Include the product type the user named AND closely related product types that would solve their task, so the catalog search can still find something useful. Example for hanging a picture: ["picture hanging kit", "wall hook", "nail", "hammer", "drill", "level", "stud finder"]. Example for a business laptop: ["laptop", "business", "notebook", "ultrabook"].
- notes: a short note about anything else relevant, or null.

Respond with ONLY a JSON object, no other text, matching exactly this shape:
{
  "action": "ask" | "recommend",
  "question": string or null (required if action is "ask", otherwise null),
  "followUp": string or null,
  "requirements": {
    "categorySlug": string or null,
    "budgetMax": number or null,
    "keywords": string[],
    "notes": string or null
  }
}`;
}

function buildExplanationPrompt(params: {
  products: FeaturedProduct[];
  requirements: ExtractedRequirements;
  userMessage: string;
  matchType: MatchType;
  categoryName: string | null;
  overBudget: boolean;
}) {
  const productList = params.products
    .map(
      (p, i) =>
        `${i + 1}. ${p.name}${p.brand ? ` (${p.brand})` : ""} — ${
          p.lowestPrice ? `from ${p.currency} ${p.lowestPrice}` : "price varies by retailer"
        }${p.shortDescription ? ` — ${p.shortDescription}` : ""}`
    )
    .join("\n");

  const situation =
    params.matchType === "related"
      ? `The catalog has no product that directly matches the request. These are other products from the closest category${
          params.categoryName ? ` (${params.categoryName})` : ""
        }. Say briefly and honestly that there's no exact match yet, then present these as alternatives that may still help.`
      : "These products matched the request. If some of them only partly fit the user's task, say how each could help.";

  const budgetNote = params.overBudget
    ? `Nothing in the catalog fits the budget of ${params.requirements.budgetMax}. Say so honestly and present these as the closest options.`
    : params.requirements.budgetMax
      ? `The user's budget is ${params.requirements.budgetMax}; these are within it.`
      : "";

  return `You are a friendly shopping adviser. The user said: "${params.userMessage}"
Requirements: ${JSON.stringify(params.requirements)}

${situation}
${budgetNote}

The ONLY real products found in the catalog:
${productList}

Write a short, honest 2-4 sentence reply referencing ONLY the products listed above by name. Mention relevant tradeoffs if there's more than one option. Do not mention any product, spec, or price that isn't listed above. Do not invent anything. Do not ask a question at the end. Plain text only, no markdown.`;
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
  let turnParsed = true;
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
    turnParsed = parsed.success;
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
    keywords: turn.requirements.keywords?.length
      ? turn.requirements.keywords
      : storedRequirements.keywords?.length
        ? storedRequirements.keywords
        : // Model reply was unusable — search with the user's own words
          // rather than showing nothing.
          turnParsed
          ? []
          : [userMessage],
    notes: turn.requirements.notes ?? storedRequirements.notes ?? null
  };

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { requirements: mergedRequirements as Prisma.InputJsonValue }
  });

  const hasSearchableInfo = Boolean(
    mergedRequirements.categorySlug || normalizeKeywords(mergedRequirements.keywords).length
  );

  // Only ask a question on its own when there's genuinely nothing to search
  // with. If the model chose "ask" but we do know what the user wants,
  // show products anyway and put its question after them.
  if (turn.action === "ask" && !hasSearchableInfo) {
    const question = turn.question ?? fallbackAskTurn.question!;
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: question }
    });
    return { conversationId: conversation.id, reply: question, products: [] };
  }

  const followUp = (turn.action === "ask" ? turn.question : turn.followUp)?.trim() || null;

  // Hand off to the deterministic matcher. Gemini never sees or influences
  // which rows come back from here.
  const { products, matchedCategoryName, matchType, overBudget } = await searchProducts(mergedRequirements);

  if (products.length === 0 && !turnParsed) {
    // Couldn't understand the message and nothing matched its words — ask.
    const question = fallbackAskTurn.question!;
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: question }
    });
    return { conversationId: conversation.id, reply: question, products: [] };
  }

  if (products.length === 0) {
    // Per spec §42: tell the user honestly rather than inventing a product.
    const reply = matchedCategoryName
      ? `I couldn't find a published product in ${matchedCategoryName} yet — our catalog is still growing. You're welcome to browse the category directly, or describe it differently and I'll look again.`
      : "I couldn't find anything in our catalog for that yet. Could you describe it differently, or try browsing our categories directly?";
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: reply }
    });
    return { conversationId: conversation.id, reply, products: [] };
  }

  let explanation: string;
  try {
    explanation = await generateText(
      buildExplanationPrompt({
        products,
        requirements: mergedRequirements,
        userMessage,
        matchType,
        categoryName: matchedCategoryName,
        overBudget
      })
    );
  } catch (error) {
    console.error("Gemini explanation call failed:", error);
    // Fails soft into a deterministic sentence built from real data only —
    // still grounded, just less conversational.
    explanation =
      matchType === "related"
        ? `I don't have an exact match yet, but these${
            matchedCategoryName ? ` from ${matchedCategoryName}` : ""
          } may help: ${products.map((p) => p.name).join(", ")}.`
        : `Here's what matches best: ${products.map((p) => p.name).join(", ")}.`;
  }

  const reply = followUp ? `${explanation}\n\n${followUp}` : explanation;

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: reply,
      metadata: { productIds: products.map((p) => p.id) }
    }
  });

  return { conversationId: conversation.id, reply, products };
}
