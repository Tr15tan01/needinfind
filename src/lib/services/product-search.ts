import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { FeaturedProduct } from "@/lib/services/catalog";
import { countKeywordHits, normalizeKeywords, scoreCandidate } from "@/lib/services/product-scoring";

/**
 * The AI assistant never queries the database directly — it hands
 * structured requirements to this module, and this module hands back real
 * catalog products. Two reasons this is a separate seam (per spec §11/§32):
 *
 * 1. Matching is deterministic, not model-generated — category match,
 *    budget match, keyword match — so Gemini can explain a result but can
 *    never fabricate one.
 * 2. This is exactly where pgvector/embeddings/hybrid search plugs in
 *    later without the AI layer changing at all.
 *
 * Search widens step by step so the user nearly always gets suggestions:
 *   1. matching words inside the chosen category
 *   2. matching words anywhere in the catalog
 *   3. other products from the chosen category (no word match)
 *   4. products from the wider category family (parent + sibling categories)
 */

export type ExtractedRequirements = {
  categorySlug?: string | null;
  budgetMax?: number | null;
  keywords?: string[];
  notes?: string | null;
};

// "match": products matched what was asked for.
// "related": nothing matched directly — these are other products from the
//            closest category, offered as alternatives.
export type MatchType = "match" | "related" | "none";

export type MatchResult = {
  products: FeaturedProduct[];
  matchedCategoryName: string | null;
  matchType: MatchType;
  // True when a budget was given but nothing fit it, so the closest
  // (over-budget) options are shown instead.
  overBudget: boolean;
};

const RESULT_LIMIT = 4;

const candidateInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  offers: { orderBy: { displayPrice: "asc" as const } },
  category: { select: { name: true } }
} satisfies Prisma.ProductInclude;

type Candidate = Prisma.ProductGetPayload<{ include: typeof candidateInclude }>;

type CategoryScope = { ids: string[]; name: string; parentFamilyIds: string[] | null };

async function resolveCategory(slug: string | null | undefined, tokens: string[]): Promise<CategoryScope | null> {
  const all = await prisma.category.findMany({
    where: { enabled: true },
    select: { id: true, name: true, slug: true, parentId: true }
  });
  if (all.length === 0) return null;

  let category = slug ? all.find((c) => c.slug === slug) : undefined;

  // Model didn't give a usable category — try to spot one from the words
  // (e.g. "business laptop" → "Laptops").
  if (!category && tokens.length) {
    category = all.find((c) => {
      const hay = `${c.name} ${c.slug}`.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });
  }
  if (!category) return null;

  const idsUnder = (rootId: string) => {
    const ids = [rootId];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  };

  return {
    ids: idsUnder(category.id),
    name: category.name,
    parentFamilyIds: category.parentId ? idsUnder(category.parentId) : null
  };
}

function keywordWhere(tokens: string[]): Prisma.ProductWhereInput {
  return {
    OR: tokens.flatMap((t) => [
      { name: { contains: t, mode: "insensitive" as const } },
      { brand: { contains: t, mode: "insensitive" as const } },
      { model: { contains: t, mode: "insensitive" as const } },
      { shortDescription: { contains: t, mode: "insensitive" as const } },
      { description: { contains: t, mode: "insensitive" as const } },
      { category: { name: { contains: t, mode: "insensitive" as const } } }
    ])
  };
}

async function findCandidates(where: Prisma.ProductWhereInput): Promise<Candidate[]> {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", ...where },
    take: 40,
    include: candidateInclude
  });
}

function rank(
  candidates: Candidate[],
  tokens: string[],
  categoryIds: string[] | null,
  budgetMax: number | null | undefined
) {
  const scored = candidates.map((p) => {
    const prices = p.offers
      .map((o) => (o.displayPrice ? Number(o.displayPrice) : null))
      .filter((v): v is number => v !== null);
    const lowestPrice = prices.length ? Math.min(...prices) : null;
    const hits = countKeywordHits(tokens, {
      name: p.name,
      other: [p.brand, p.model, p.shortDescription, p.description, p.category?.name].filter(Boolean).join(" ")
    });

    const score = scoreCandidate({
      hasCategoryMatch: categoryIds ? categoryIds.includes(p.categoryId) : false,
      lowestPrice,
      budgetMax,
      featured: p.featured,
      offerCount: p.offers.length,
      keywordHits: hits
    });
    return { p, lowestPrice, score };
  });

  // If the user gave a budget and anything fits it, show only what fits.
  let overBudget = false;
  let pool = scored;
  if (budgetMax) {
    const within = scored.filter((s) => s.lowestPrice !== null && s.lowestPrice <= budgetMax);
    if (within.length > 0) pool = within;
    else if (scored.some((s) => s.lowestPrice !== null)) overBudget = true;
  }

  const top = pool.sort((a, b) => b.score - a.score).slice(0, RESULT_LIMIT);
  const products: FeaturedProduct[] = top.map(({ p, lowestPrice }) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    brand: p.brand,
    imageUrl: p.images[0]?.url ?? null,
    lowestPrice,
    currency: p.offers[0]?.currency ?? "USD",
    offerCount: p.offers.length
  }));
  return { products, overBudget };
}

export async function searchProducts(requirements: ExtractedRequirements): Promise<MatchResult> {
  try {
    const tokens = normalizeKeywords(requirements.keywords);
    const scope = await resolveCategory(requirements.categorySlug, tokens);
    const budget = requirements.budgetMax;

    const attempt = async (where: Prisma.ProductWhereInput, categoryIds: string[] | null, matchType: MatchType) => {
      const candidates = await findCandidates(where);
      if (candidates.length === 0) return null;
      const { products, overBudget } = rank(candidates, tokens, categoryIds, budget);
      return {
        products,
        overBudget,
        matchType,
        matchedCategoryName: scope?.name ?? candidates[0]?.category?.name ?? null
      };
    };

    // 1. Words inside the category
    if (scope && tokens.length) {
      const r = await attempt({ categoryId: { in: scope.ids }, ...keywordWhere(tokens) }, scope.ids, "match");
      if (r) return r;
    }
    // 2. Words anywhere
    if (tokens.length) {
      const r = await attempt(keywordWhere(tokens), scope?.ids ?? null, "match");
      if (r) return r;
    }
    // 3. Anything in the category (no tokens at all counts as a direct match)
    if (scope) {
      const r = await attempt({ categoryId: { in: scope.ids } }, scope.ids, tokens.length ? "related" : "match");
      if (r) return r;
    }
    // 4. Wider category family
    if (scope?.parentFamilyIds) {
      const r = await attempt({ categoryId: { in: scope.parentFamilyIds } }, scope.parentFamilyIds, "related");
      if (r) return r;
    }

    return { products: [], matchedCategoryName: scope?.name ?? null, matchType: "none", overBudget: false };
  } catch (error) {
    console.error("searchProducts failed:", error);
    return { products: [], matchedCategoryName: null, matchType: "none", overBudget: false };
  }
}
