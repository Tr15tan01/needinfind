import "server-only";
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
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
          // Prisma's generated Json input type is a recursive union
          // (InputJsonValue) that a plain Record<string, unknown> isn't
          // structurally assignable to, even though the actual runtime
          // shape is fine — this cast is the standard, documented way to
          // bridge that (see Prisma's own docs on the Json field type).
          metadata: (metadata as Prisma.InputJsonValue) ?? undefined
        }
      });
    } catch (error) {
      console.error(`recordEvent(${type}) failed:`, error);
    }
  });
}
