"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

async function revalidateCategoryPaths(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true, parent: { select: { slug: true } } }
  });
  if (!category) return;

  if (category.parent) {
    revalidatePath(`/${category.parent.slug}/${category.slug}`);
    revalidatePath(`/${category.parent.slug}`); // subcategory chips shown there
  } else {
    revalidatePath(`/${category.slug}`);
  }
  revalidatePath("/");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;

  const category = await prisma.category.create({
    data: {
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      description: String(formData.get("description") ?? "") || null,
      parentId,
      featured: formData.get("featured") === "on"
    }
  });

  revalidatePath("/admin/categories");
  await revalidateCategoryPaths(category.id);
}

export async function toggleCategoryEnabled(categoryId: string, enabled: boolean) {
  await requireAdmin();
  await prisma.category.update({ where: { id: categoryId }, data: { enabled } });
  revalidatePath("/admin/categories");
  await revalidateCategoryPaths(categoryId);
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true, parent: { select: { slug: true } } }
  });

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  if (category) {
    if (category.parent) {
      revalidatePath(`/${category.parent.slug}/${category.slug}`);
      revalidatePath(`/${category.parent.slug}`);
    } else {
      revalidatePath(`/${category.slug}`);
    }
  }
  revalidatePath("/");
}
