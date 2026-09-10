"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function parseFieldLines(raw: string | null) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createComparison(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const productIds = formData.getAll("productIds").map(String).filter(Boolean);
  if (productIds.length < 2) throw new Error("Select at least two products to compare.");

  const comparison = await prisma.comparison.create({
    data: {
      title,
      slug: slugInput ? slugify(slugInput) : slugify(title),
      description: String(formData.get("description") ?? "") || null,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      featured: formData.get("featured") === "on",
      fields: parseFieldLines(String(formData.get("fields") ?? "")),
      products: {
        create: productIds.map((productId, i) => ({ productId, order: i }))
      }
    }
  });

  revalidatePath("/admin/comparisons");
  revalidatePath("/compare");
  revalidatePath("/");
  redirect(`/admin/comparisons/${comparison.id}`);
}

export async function updateComparison(comparisonId: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();

  const comparison = await prisma.comparison.update({
    where: { id: comparisonId },
    data: {
      title,
      slug: slugInput ? slugify(slugInput) : slugify(title),
      description: String(formData.get("description") ?? "") || null,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      featured: formData.get("featured") === "on",
      fields: parseFieldLines(String(formData.get("fields") ?? ""))
    }
  });

  revalidatePath("/admin/comparisons");
  revalidatePath(`/admin/comparisons/${comparisonId}`);
  revalidatePath(`/compare/${comparison.slug}`);
  revalidatePath("/compare");
  revalidatePath("/");
}

export async function deleteComparison(comparisonId: string) {
  await requireAdmin();
  await prisma.comparison.delete({ where: { id: comparisonId } });
  revalidatePath("/admin/comparisons");
  revalidatePath("/compare");
  redirect("/admin/comparisons");
}

export async function addProductToComparison(comparisonId: string, formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  if (!productId) throw new Error("Select a product to add.");

  const count = await prisma.comparisonProduct.count({ where: { comparisonId } });
  await prisma.comparisonProduct.create({
    data: { comparisonId, productId, order: count }
  });

  revalidatePath(`/admin/comparisons/${comparisonId}`);
  revalidatePath("/compare");
}

export async function removeProductFromComparison(comparisonId: string, comparisonProductId: string) {
  await requireAdmin();
  await prisma.comparisonProduct.delete({ where: { id: comparisonProductId } });
  revalidatePath(`/admin/comparisons/${comparisonId}`);
  revalidatePath("/compare");
}
