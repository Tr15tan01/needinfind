import "server-only";
import type { Session } from "next-auth";
import { auth } from "@/auth";

function isNextInternalSignal(error: unknown): boolean {
  // Next.js signals things like "this route needs dynamic rendering"
  // (DYNAMIC_SERVER_USAGE) and redirect()/notFound() via specially-tagged
  // errors thrown during render — these are framework control flow, not
  // real failures, and MUST be allowed to propagate. A naive catch-all
  // here would silently break Next's automatic dynamic-rendering
  // detection for every page that calls this (discovered exactly that way
  // — see git history/PR notes for the build failure this fixed).
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE" ||
      (error as { digest: string }).digest.startsWith("NEXT_"))
  );
}

/**
 * `auth()` can throw — most commonly a JWTSessionError when a browser has
 * a session cookie encrypted with an AUTH_SECRET that's since been
 * rotated. Every call site in this app treats "no valid session" as
 * equivalent to "signed out" (show the guest experience, redirect to
 * login, etc.) — this wrapper makes that actually true instead of the
 * error crashing the whole page, which is what happened when SiteHeader
 * called `auth()` directly (it renders on every page via the root layout,
 * so one bad cookie took down the entire site rather than just showing
 * the signed-out header).
 */
export async function getSafeSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    if (isNextInternalSignal(error)) throw error;
    console.error("auth() failed — treating as signed out:", error);
    return null;
  }
}
