"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { recordEvent } from "@/lib/services/analytics";
import { isAuthRateLimited } from "@/lib/rate-limit";

export async function registerAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (isAuthRateLimited(`register:${email}`)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't confirm which emails already have accounts.
    return { error: "Couldn't create that account. Try signing in instead." };
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hash(password, 10)
    }
  });

  recordEvent("REGISTRATION", { userId: newUser.id });

  try {
    await signIn("customer-credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error;
  }
}
