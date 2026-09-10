"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function toggleSectionVisible(sectionId: string, visible: boolean) {
  await requireAdmin();
  await prisma.homepageSection.update({ where: { id: sectionId }, data: { visible } });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function updateHeroCopy(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  await prisma.homepageSection.upsert({
    where: { id: "hero" },
    update: { title, body },
    create: { id: "hero", type: "HERO", title, body, order: 0, visible: true }
  });

  revalidatePath("/admin/homepage");
  revalidatePath("/");
}
