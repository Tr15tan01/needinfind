import { createClient } from "@supabase/supabase-js";

/**
 * Optional Supabase clients — NOT used for database access (Prisma handles
 * that via DATABASE_URL/DIRECT_URL). These are here for the day something
 * needs supabase-js directly, e.g. Supabase Storage for product images.
 *
 * Supabase's current API key system: "publishable" keys are safe in the
 * browser (replaces the old "anon" key); "secret" keys are server-only and
 * must never reach client code (replaces the old "service_role" key).
 */

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient(url, publishableKey);
}

// Server-only — uses the secret key, which bypasses row-level security.
// Never import this from a Client Component.
export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false }
  });
}
