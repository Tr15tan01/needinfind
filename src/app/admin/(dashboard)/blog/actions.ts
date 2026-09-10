"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

async function resolveCategoryId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const category = await prisma.blogCategory.upsert({
    where: { slug },
    update: {},
    create: { name: trimmed, slug }
  });
  return category.id;
}

async function resolveTagIds(rawTags: string): Promise<string[]> {
  const names = rawTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (names.length === 0) return [];

  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug }
    });
    ids.push(tag.id);
  }
  return ids;
}

function buildPostData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED";
  const relatedProductIds = formData.getAll("relatedProductIds").map(String).filter(Boolean);
  const relatedComparisonIds = formData.getAll("relatedComparisonIds").map(String).filter(Boolean);

  return {
    title,
    slugInput: String(formData.get("slug") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    excerpt: String(formData.get("excerpt") ?? "") || null,
    featuredImage: String(formData.get("featuredImage") ?? "") || null,
    author: String(formData.get("author") ?? "") || null,
    status,
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
    canonicalUrl: String(formData.get("canonicalUrl") ?? "") || null,
    categoryName: String(formData.get("categoryName") ?? ""),
    tagsRaw: String(formData.get("tags") ?? ""),
    relatedProductIds,
    relatedComparisonIds
  };
}

export async function createPost(formData: FormData) {
  await requireAdmin();
  const data = buildPostData(formData);
  const categoryId = await resolveCategoryId(data.categoryName);
  const tagIds = await resolveTagIds(data.tagsRaw);

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slugInput ? slugify(data.slugInput) : slugify(data.title),
      content: data.content,
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      author: data.author,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      canonicalUrl: data.canonicalUrl,
      categoryId,
      tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      relatedProductIds: data.relatedProductIds,
      relatedComparisonIds: data.relatedComparisonIds
    }
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  redirect(`/admin/blog/${post.id}`);
}

export async function updatePost(postId: string, formData: FormData) {
  await requireAdmin();
  const data = buildPostData(formData);
  const categoryId = await resolveCategoryId(data.categoryName);
  const tagIds = await resolveTagIds(data.tagsRaw);

  const existing = await prisma.blogPost.findUnique({ where: { id: postId } });
  const becamePublished = data.status === "PUBLISHED" && existing?.status !== "PUBLISHED";

  const post = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug: data.slugInput ? slugify(data.slugInput) : slugify(data.title),
      content: data.content,
      excerpt: data.excerpt,
      featuredImage: data.featuredImage,
      author: data.author,
      status: data.status,
      publishedAt: becamePublished ? new Date() : existing?.publishedAt,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      canonicalUrl: data.canonicalUrl,
      categoryId,
      tags: { set: tagIds.map((id) => ({ id })) },
      relatedProductIds: data.relatedProductIds,
      relatedComparisonIds: data.relatedComparisonIds
    }
  });

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${postId}`);
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export async function deletePost(postId: string) {
  await requireAdmin();
  await prisma.blogPost.delete({ where: { id: postId } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}
