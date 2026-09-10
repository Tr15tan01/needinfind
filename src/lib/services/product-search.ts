import "server-only";
import { prisma } from "@/lib/prisma";
import type { FeaturedProduct } from "@/lib/services/catalog";
import { scoreCandidate } from "@/lib/services/product-scoring";

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
 */

export type ExtractedRequirements = {
  categorySlug?: string | null;
  budgetMax?: number | null;
  keywords?: string[];
  notes?: string | null;
};

export type MatchResult = {
  products: FeaturedProduct[];
  matchedCategoryName: string | null;
};

export async function searchProducts(requirements: ExtractedRequirements): Promise<MatchResult> {
  try {
    let categoryIds: string[] | null = null;
    let matchedCategoryName: string | null = null;

    if (requirements.categorySlug) {
      const category = await prisma.category.findFirst({
        where: { slug: requirements.categorySlug, enabled: true }
      });
      if (category) {
        matchedCategoryName = category.name;
        const subs = await prisma.category.findMany({
          where: { parentId: category.id, enabled: true },
          select: { id: true }
        });
        categoryIds = [category.id, ...subs.map((s: { id: string }) => s.id)];
      }
    }

    const keywordFilters = (requirements.keywords ?? []).slice(0, 5).map((kw) => ({
      OR: [
        { name: { contains: kw, mode: "insensitive" as const } },
        { brand: { contains: kw, mode: "insensitive" as const } },
        { shortDescription: { contains: kw, mode: "insensitive" as const } }
      ]
    }));

    const candidates = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
        ...(keywordFilters.length ? { AND: keywordFilters } : {})
      },
      take: 20,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        offers: { orderBy: { displayPrice: "asc" } }
      }
    });

    type Candidate = (typeof candidates)[number];

    const scored = candidates
      .map((p: Candidate) => {
        const prices = p.offers
          .map((o: Candidate["offers"][number]) => (o.displayPrice ? Number(o.displayPrice) : null))
          .filter((v: number | null): v is number => v !== null);
        const lowestPrice = prices.length ? Math.min(...prices) : null;

        const score = scoreCandidate({
          hasCategoryMatch: Boolean(categoryIds),
          lowestPrice,
          budgetMax: requirements.budgetMax,
          featured: p.featured,
          offerCount: p.offers.length
        });

        return { p, lowestPrice, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const products: FeaturedProduct[] = scored.map(({ p, lowestPrice }) => ({
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

    return { products, matchedCategoryName };
  } catch (error) {
    console.error("searchProducts failed:", error);
    return { products: [], matchedCategoryName: null };
  }
}
