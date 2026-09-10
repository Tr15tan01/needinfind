"use server";

import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function createPlan(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  const slugInput = String(formData.get("slug") ?? "").trim();

  await prisma.pricingPlan.create({
    data: {
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      price: Number(formData.get("price") ?? 0),
      billingInterval: String(formData.get("billingInterval") ?? "MONTHLY") as "MONTHLY" | "YEARLY",
      messageAllowance: Number(formData.get("messageAllowance") ?? 0),
      order: Number(formData.get("order") ?? 0)
    }
  });

  revalidatePath("/admin/pricing-plans");
}

export async function updatePlan(planId: string, formData: FormData) {
  await requireAdmin();

  await prisma.pricingPlan.update({
    where: { id: planId },
    data: {
      price: Number(formData.get("price") ?? 0),
      messageAllowance: Number(formData.get("messageAllowance") ?? 0),
      enabled: formData.get("enabled") === "on"
    }
  });

  revalidatePath("/admin/pricing-plans");
  revalidatePath("/admin/ai-usage");
}

export async function deletePlan(planId: string) {
  await requireAdmin();
  await prisma.pricingPlan.delete({ where: { id: planId } });
  revalidatePath("/admin/pricing-plans");
}
