"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { GUEST_LIMIT_SETTING_KEY } from "@/lib/services/usage";

export async function updateGuestLimit(formData: FormData) {
  await requireAdmin();

  const value = Number(formData.get("guestLimit"));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Guest message limit must be a non-negative number.");
  }

  await prisma.siteSetting.upsert({
    where: { key: GUEST_LIMIT_SETTING_KEY },
    update: { value },
    create: { key: GUEST_LIMIT_SETTING_KEY, value }
  });

  revalidatePath("/admin/ai-usage");
}
