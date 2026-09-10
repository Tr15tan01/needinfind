import "server-only";
import { cookies } from "next/headers";
import { GUEST_COOKIE_NAME } from "@/lib/guest-cookie";

/**
 * Reads the anonymous guest id that middleware.ts assigns to any
 * unauthenticated visitor. Used from Phase 5/6 onward to associate
 * `Conversation` / `UsageRecord` rows with a guest, per spec §12/§15:
 * guests can use the assistant without registering, and their usage is
 * still tracked so limits (Phase 6) can be enforced server-side.
 *
 * Server Components can read cookies but not set them, so the cookie
 * itself is written by middleware — this is read-only.
 */
export async function getGuestToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE_NAME)?.value ?? null;
}
