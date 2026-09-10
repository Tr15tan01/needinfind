import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Spec §29: "a clean internal event model so external analytics can be
 * added later" — not a full analytics platform. Every call is scheduled
 * via `after()` so it runs once the response has already been sent, and is
 * wrapped so a logging failure can never affect the page/request itself.
 */

export type EventType =
  | "PRODUCT_VIEW"
  | "AFFILIATE_CLICK"
  | "AI_CONVERSATION_STARTED"
  | "AI_MESSAGE"
  | "REGISTRATION"
  | "COMPARISON_VIEW"
  | "BLOG_VIEW"
  | "SUBSCRIPTION_STARTED";

export type EventIdentity = { userId?: string | null; guestToken?: string | null };

export function recordEvent(
  type: EventType,
  identity: EventIdentity,
  metadata?: Record<string, unknown>
) {
  after(async () => {
    try {
      await prisma.analyticsEvent.create({
        data: {
          type,
          userId: identity.userId ?? null,
          guestToken: identity.userId ? null : identity.guestToken ?? null,
          metadata: metadata ?? undefined
        }
      });
    } catch (error) {
      console.error(`recordEvent(${type}) failed:`, error);
    }
  });
}
