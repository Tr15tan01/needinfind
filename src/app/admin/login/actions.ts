"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isAuthRateLimited } from "@/lib/rate-limit";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  // Keyed by the attempted email rather than IP — simpler, and just as
  // effective against credential stuffing since the attacker still can't
  // exceed 5 guesses per 15 minutes for any single account.
  if (typeof email === "string" && isAuthRateLimited(`admin-login:${email.toLowerCase()}`)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  try {
    await signIn("admin-credentials", {
      email,
      password,
      redirectTo: "/admin"
    });
    return {};
  } catch (error) {
    // Auth.js throws a special redirect error on success — let it propagate.
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
