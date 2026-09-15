"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Product/category pages are cached with ISR (see their `revalidate`
// exports), so every path a product change could affect needs to be
// revalidated explicitly here — the time-based revalidation is a backstop,
// not the primary invalidation mechanism.
//
// Takes the already-fetched product shape rather than querying for it
// itself — every call site already has this data from its own create/
// update/delete query, so re-fetching here was a redundant round-trip.
type RevalidateTarget = {
  slug: string;
  category: { slug: string; parent: { slug: string } | null } | null;
};

function revalidateProductPaths(product: RevalidateTarget) {
  revalidatePath(`/products/${product.slug}`);
  if (product.category) {
    revalidatePath(`/${product.category.slug}`);
    if (product.category.parent) {
      revalidatePath(`/${product.category.parent.slug}/${product.category.slug}`);
    }
  }
  revalidatePath("/");
}

// "CPU: Apple M3\nRAM: 16 GB" -> [{label: "CPU", value: "Apple M3"}, ...]
// Deliberately simple line-based input rather than a dynamic repeating-field
// UI — keeps the admin form usable without a large client-side component,
// per spec §17's "don't over-build the CMS" guidance.
function parseLines(raw: string | null) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [label, ...rest] = line.split(":");
      const safeLabel = (label ?? line).trim();
      return { label: safeLabel, value: rest.join(":").trim() || safeLabel, order: i };
    });
}

function parseFeatures(raw: string | null) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      if (line.startsWith("+")) return { kind: "PRO" as const, text: line.slice(1).trim(), order: i };
      if (line.startsWith("-")) return { kind: "CON" as const, text: line.slice(1).trim(), order: i };
      return { kind: "FEATURE" as const, text: line, order: i };
    });
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!name || !categoryId) throw new Error("Name and category are required.");

  const product = await prisma.product.create({
    data: {
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      brand: String(formData.get("brand") ?? "") || null,
      model: String(formData.get("model") ?? "") || null,
      shortDescription: String(formData.get("shortDescription") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      status: (String(formData.get("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED"),
      featured: formData.get("featured") === "on",
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      categoryId,
      images: formData.get("imageUrl")
        ? { create: [{ url: String(formData.get("imageUrl")), order: 0 }] }
        : undefined,
      specifications: { create: parseLines(String(formData.get("specifications") ?? "")) },
      features: { create: parseFeatures(String(formData.get("features") ?? "")) }
    },
    include: { category: { select: { slug: true, parent: { select: { slug: true } } } } }
  });

  revalidatePath("/admin/products");
  revalidateProductPaths(product);
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!name || !categoryId) throw new Error("Name and category are required.");

  const priorCategory = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: { select: { slug: true, parent: { select: { slug: true } } } } }
  });

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        name,
        slug: slugInput ? slugify(slugInput) : slugify(name),
        brand: String(formData.get("brand") ?? "") || null,
        model: String(formData.get("model") ?? "") || null,
        shortDescription: String(formData.get("shortDescription") ?? "") || null,
        description: String(formData.get("description") ?? "") || null,
        status: String(formData.get("status") ?? "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        featured: formData.get("featured") === "on",
        seoTitle: String(formData.get("seoTitle") ?? "") || null,
        seoDescription: String(formData.get("seoDescription") ?? "") || null,
        categoryId
      },
      include: { category: { select: { slug: true, parent: { select: { slug: true } } } } }
    });

    // Specs/features are fully replaced on each save — simplest correct
    // behavior for a line-based textarea input.
    await tx.productSpecification.deleteMany({ where: { productId } });
    await tx.productFeature.deleteMany({ where: { productId } });

    const specs = parseLines(String(formData.get("specifications") ?? ""));
    if (specs.length) {
      await tx.productSpecification.createMany({
        data: specs.map((s) => ({ ...s, productId }))
      });
    }

    const features = parseFeatures(String(formData.get("features") ?? ""));
    if (features.length) {
      await tx.productFeature.createMany({
        data: features.map((f) => ({ ...f, productId }))
      });
    }

    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    if (imageUrl) {
      const existing = await tx.productImage.findFirst({ where: { productId }, orderBy: { order: "asc" } });
      if (existing) {
        await tx.productImage.update({ where: { id: existing.id }, data: { url: imageUrl } });
      } else {
        await tx.productImage.create({ data: { productId, url: imageUrl, order: 0 } });
      }
    }

    return updated;
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidateProductPaths(updatedProduct);
  // Category may have changed — revalidate the old one too, since the
  // product's ISR-cached page there won't otherwise notice it's gone.
  if (priorCategory?.category) {
    revalidatePath(`/${priorCategory.category.slug}`);
    if (priorCategory.category.parent) {
      revalidatePath(`/${priorCategory.category.parent.slug}/${priorCategory.category.slug}`);
    }
  }
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  const product = await prisma.product.delete({
    where: { id: productId },
    select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } }
  });

  revalidatePath("/admin/products");
  revalidateProductPaths(product);
  redirect("/admin/products");
}

export async function addOffer(productId: string, formData: FormData) {
  await requireAdmin();

  const retailerId = String(formData.get("retailerId") ?? "");
  const affiliateUrl = String(formData.get("affiliateUrl") ?? "").trim();
  if (!retailerId || !affiliateUrl) throw new Error("Retailer and affiliate URL are required.");

  const priceRaw = String(formData.get("displayPrice") ?? "").trim();
  if (priceRaw && Number.isNaN(Number(priceRaw))) {
    throw new Error("Display price must be a number.");
  }

  const offer = await prisma.offer.create({
    data: {
      productId,
      retailerId,
      affiliateUrl,
      displayPrice: priceRaw ? Number(priceRaw) : null,
      currency: String(formData.get("currency") ?? "USD"),
      availability: String(formData.get("availability") ?? "UNKNOWN") as
        | "IN_STOCK"
        | "OUT_OF_STOCK"
        | "UNKNOWN",
      featured: formData.get("offerFeatured") === "on"
    },
    select: {
      product: { select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } } }
    }
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidateProductPaths(offer.product);
}

export async function deleteOffer(productId: string, offerId: string) {
  await requireAdmin();
  const offer = await prisma.offer.delete({
    where: { id: offerId },
    select: {
      product: { select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } } }
    }
  });
  revalidatePath(`/admin/products/${productId}`);
  revalidateProductPaths(offer.product);
}
