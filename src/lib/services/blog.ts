import "server-only";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 9;

export async function getPublishedPosts(page = 1) {
  try {
    const where = { status: "PUBLISHED" as const };
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { publishedAt: "desc" },
        include: { category: true, tags: true }
      })
    ]);

    return { posts, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), page };
  } catch (error) {
    console.error("getPublishedPosts failed:", error);
    return { posts: [] as never[], total: 0, pageCount: 1, page: 1 };
  }
}

export async function getRecentPosts(limit = 3) {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      take: limit,
      orderBy: { publishedAt: "desc" }
    });
  } catch (error) {
    console.error("getRecentPosts failed:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { category: true, tags: true }
    });
    if (!post) return null;

    const relatedProductIds = Array.isArray(post.relatedProductIds)
      ? (post.relatedProductIds as string[])
      : [];
    const relatedComparisonIds = Array.isArray(post.relatedComparisonIds)
      ? (post.relatedComparisonIds as string[])
      : [];

    const [relatedProducts, relatedComparisons] = await Promise.all([
      relatedProductIds.length
        ? prisma.product.findMany({
            where: { id: { in: relatedProductIds }, status: "PUBLISHED" },
            select: { id: true, name: true, slug: true }
          })
        : Promise.resolve([]),
      relatedComparisonIds.length
        ? prisma.comparison.findMany({
            where: { id: { in: relatedComparisonIds } },
            select: { id: true, title: true, slug: true }
          })
        : Promise.resolve([])
    ]);

    return { post, relatedProducts, relatedComparisons };
  } catch (error) {
    console.error("getPostBySlug failed:", error);
    return null;
  }
}

// Used for the product page's "Related articles" section — the inverse
// lookup of relatedProductIds, since that field lives on BlogPost.
export async function getPostsForProduct(productId: string) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, relatedProductIds: true }
    });
    return posts.filter((p: (typeof posts)[number]) => {
      const ids = Array.isArray(p.relatedProductIds) ? (p.relatedProductIds as string[]) : [];
      return ids.includes(productId);
    });
  } catch (error) {
    console.error("getPostsForProduct failed:", error);
    return [];
  }
}
