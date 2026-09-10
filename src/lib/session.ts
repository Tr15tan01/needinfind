import "server-only";
import { getSafeSession } from "@/lib/safe-auth";

/**
 * Defense-in-depth: middleware.ts already gates /admin at the route level,
 * but every admin Server Action calls this too, so a mutation can never
 * succeed just because someone found a way to reach the handler directly.
 */
export async function requireAdmin() {
  const session = await getSafeSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    throw new Error("Not authorized.");
  }

  return session!;
}
