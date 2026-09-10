import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fails soft to just the homepage if the DB is briefly unreachable —
  // a partial sitemap is still far better than a 500 on this route.
  try {
    const [categories, products, comparisons, posts] = await Promise.all([
      prisma.category.findMany({ where: { enabled: true }, select: { slug: true, parent: { select: { slug: true } }, updatedAt: true } }),
      prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.comparison.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } })
    ]);

    type CategoryRow = (typeof categories)[number];
    type ProductRow = (typeof products)[number];
    type ComparisonRow = (typeof comparisons)[number];
    type PostRow = (typeof posts)[number];

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c: CategoryRow) => ({
      url: c.parent ? `${SITE_URL}/${c.parent.slug}/${c.slug}` : `${SITE_URL}/${c.slug}`,
      lastModified: c.updatedAt
    }));

    const productUrls: MetadataRoute.Sitemap = products.map((p: ProductRow) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt
    }));

    const comparisonUrls: MetadataRoute.Sitemap = comparisons.map((c: ComparisonRow) => ({
      url: `${SITE_URL}/compare/${c.slug}`,
      lastModified: c.updatedAt
    }));

    const blogUrls: MetadataRoute.Sitemap = posts.map((p: PostRow) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt
    }));

    return [
      { url: SITE_URL, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
      { url: `${SITE_URL}/compare`, changeFrequency: "weekly", priority: 0.6 },
      ...categoryUrls,
      ...productUrls,
      ...comparisonUrls,
      ...blogUrls
    ];
  } catch (error) {
    console.error("sitemap generation failed:", error);
    return [{ url: SITE_URL, changeFrequency: "daily", priority: 1 }];
  }
}
