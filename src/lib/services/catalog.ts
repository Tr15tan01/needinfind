import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Catalog reads for the public site go through this module rather than
 * scattering prisma.product.findMany calls through page components. Two
 * reasons: (1) it's the seam the AI assistant's ProductSearchService will
 * sit behind in Phase 5, so matching logic never has to know about raw SQL;
 * (2) every function here fails soft — if the database is unreachable,
 * pages render an empty/fallback state instead of crashing (spec §39/40:
 * product browsing must keep working independently of any one dependency).
 */

export type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  brand: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  currency: string;
  offerCount: number;
};

export async function getFeaturedProducts(limit = 3): Promise<FeaturedProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        offers: { orderBy: { displayPrice: "asc" } }
      }
    });

    return products.map(toFeaturedProduct);
  } catch (error) {
    console.error("getFeaturedProducts failed:", error);
    return [];
  }
}

export async function getFeaturedCategories(limit = 4) {
  try {
    return await prisma.category.findMany({
      where: { enabled: true, featured: true },
      take: limit,
      orderBy: { order: "asc" }
    });
  } catch (error) {
    console.error("getFeaturedCategories failed:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
        images: { orderBy: { order: "asc" } },
        specifications: { orderBy: { order: "asc" } },
        features: { orderBy: { order: "asc" } },
        offers: { include: { retailer: true }, orderBy: { displayPrice: "asc" } }
      }
    });
  } catch (error) {
    console.error("getProductBySlug failed:", error);
    return null;
  }
}

// --- Category browsing (Phase 3) -------------------------------------------

export type NavCategory = { id: string; name: string; slug: string };

// Top-level, enabled categories — used for header nav. Kept separate from
// getFeaturedCategories (homepage) since nav shouldn't depend on featured
// status: every enabled top-level category belongs in the nav.
export async function getTopLevelCategories(limit = 8): Promise<NavCategory[]> {
  try {
    return await prisma.category.findMany({
      where: { enabled: true, parentId: null },
      take: limit,
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true }
    });
  } catch (error) {
    console.error("getTopLevelCategories failed:", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findFirst({
      where: { slug, enabled: true },
      include: {
        parent: true,
        subcategories: { where: { enabled: true }, orderBy: { order: "asc" } }
      }
    });
  } catch (error) {
    console.error("getCategoryBySlug failed:", error);
    return null;
  }
}

const PAGE_SIZE = 12;

export async function getProductsByCategory(
  categoryId: string,
  { page = 1, includeSubcategories = false }: { page?: number; includeSubcategories?: boolean } = {}
) {
  try {
    const categoryIds = [categoryId];
    if (includeSubcategories) {
      const subs = await prisma.category.findMany({
        where: { parentId: categoryId, enabled: true },
        select: { id: true }
      });
      categoryIds.push(...subs.map((s: { id: string }) => s.id));
    }

    const where = { status: "PUBLISHED" as const, categoryId: { in: categoryIds } };
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { updatedAt: "desc" },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          offers: { orderBy: { displayPrice: "asc" } }
        }
      })
    ]);

    return {
      products: products.map(toFeaturedProduct),
      total,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      page
    };
  } catch (error) {
    console.error("getProductsByCategory failed:", error);
    return { products: [] as FeaturedProduct[], total: 0, pageCount: 1, page: 1 };
  }
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED", categoryId, id: { not: productId } },
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        offers: { orderBy: { displayPrice: "asc" } }
      }
    });
    return products.map(toFeaturedProduct);
  } catch (error) {
    console.error("getRelatedProducts failed:", error);
    return [] as FeaturedProduct[];
  }
}

// Shared mapper — pulled out of getFeaturedProducts so category/related
// listings return the exact same card shape ProductCard already renders.
function toFeaturedProduct(p: {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  brand: string | null;
  images: { url: string }[];
  offers: { displayPrice: unknown; currency: string }[];
}): FeaturedProduct {
  const prices = p.offers
    .map((o) => (o.displayPrice ? Number(o.displayPrice) : null))
    .filter((v): v is number => v !== null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    brand: p.brand,
    imageUrl: p.images[0]?.url ?? null,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    currency: p.offers[0]?.currency ?? "USD",
    offerCount: p.offers.length
  };
}
