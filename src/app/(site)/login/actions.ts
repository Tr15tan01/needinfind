"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isAuthRateLimited } from "@/lib/rate-limit";

export async function credentialsLoginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email === "string" && isAuthRateLimited(`login:${email.toLowerCase()}`)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  try {
    await signIn("customer-credentials", {
      email,
      password,
      redirectTo: "/"
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
