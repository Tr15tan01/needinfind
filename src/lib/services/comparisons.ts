import "server-only";
import { prisma } from "@/lib/prisma";

export type ComparisonProductData = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  lowestPrice: number | null;
  currency: string;
  specs: Record<string, string>;
};

export type ComparisonData = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  fields: string[];
  products: ComparisonProductData[];
};

/**
 * Comparisons are pure objective specs (spec §18: "primarily use objective
 * facts/specifications" — no AI-generated claims here). `Comparison.fields`
 * lets an admin pin an explicit row order; if it's empty, rows are derived
 * from the union of every included product's real spec labels, so a
 * comparison is never missing data it actually has.
 */
export async function getComparisonBySlug(slug: string): Promise<ComparisonData | null> {
  try {
    const comparison = await prisma.comparison.findUnique({
      where: { slug },
      include: {
        products: {
          orderBy: { order: "asc" },
          include: {
            product: {
              include: {
                images: { orderBy: { order: "asc" }, take: 1 },
                specifications: true,
                offers: { orderBy: { displayPrice: "asc" } }
              }
            }
          }
        }
      }
    });
    if (!comparison) return null;

    type ComparisonProductRow = (typeof comparison.products)[number];

    const products: ComparisonProductData[] = comparison.products.map((cp: ComparisonProductRow) => {
      const p = cp.product;
      const prices = p.offers
        .map((o: (typeof p.offers)[number]) => (o.displayPrice ? Number(o.displayPrice) : null))
        .filter((v: number | null): v is number => v !== null);

      const specs: Record<string, string> = {};
      for (const s of p.specifications as { label: string; value: string }[]) {
        specs[s.label] = s.value;
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        imageUrl: p.images[0]?.url ?? null,
        lowestPrice: prices.length ? Math.min(...prices) : null,
        currency: p.offers[0]?.currency ?? "USD",
        specs
      };
    });

    let fields = Array.isArray(comparison.fields) ? (comparison.fields as string[]) : [];
    if (fields.length === 0) {
      const seen = new Set<string>();
      for (const product of products) {
        for (const label of Object.keys(product.specs)) seen.add(label);
      }
      fields = Array.from(seen);
    }

    return {
      id: comparison.id,
      title: comparison.title,
      slug: comparison.slug,
      description: comparison.description,
      seoTitle: comparison.seoTitle,
      seoDescription: comparison.seoDescription,
      fields,
      products
    };
  } catch (error) {
    console.error("getComparisonBySlug failed:", error);
    return null;
  }
}

export async function listComparisons({ featuredOnly = false }: { featuredOnly?: boolean } = {}) {
  try {
    return await prisma.comparison.findMany({
      where: featuredOnly ? { featured: true } : undefined,
      orderBy: { createdAt: "desc" },
      include: { products: { include: { product: { select: { name: true } } } } }
    });
  } catch (error) {
    console.error("listComparisons failed:", error);
    return [];
  }
}

export async function getComparisonsForProduct(productId: string) {
  try {
    const rows = await prisma.comparisonProduct.findMany({
      where: { productId },
      include: { comparison: true }
    });
    return rows.map((r: (typeof rows)[number]) => r.comparison);
  } catch (error) {
    console.error("getComparisonsForProduct failed:", error);
    return [];
  }
}
