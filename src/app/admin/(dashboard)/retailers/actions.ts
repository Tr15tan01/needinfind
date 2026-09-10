"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function createRetailer(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();

  await prisma.retailer.create({
    data: {
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
      logoUrl: String(formData.get("logoUrl") ?? "") || null,
      affiliateDisclosure: String(formData.get("affiliateDisclosure") ?? "") || null
    }
  });

  revalidatePath("/admin/retailers");
}

export async function toggleRetailerEnabled(retailerId: string, enabled: boolean) {
  await requireAdmin();
  await prisma.retailer.update({ where: { id: retailerId }, data: { enabled } });
  revalidatePath("/admin/retailers");
}

export async function deleteRetailer(retailerId: string) {
  await requireAdmin();
  await prisma.retailer.delete({ where: { id: retailerId } });
  revalidatePath("/admin/retailers");
}
