import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Usage enforcement per spec §13/§14: limits are entirely DB-driven (never
 * hardcoded), checked and consumed server-side (never trusting a client
 * counter), and scoped so a page refresh or cookie manipulation can't
 * reset a *registered* user's count. Guests are inherently limited by
 * being cookie-based — see the honesty note on that in README.
 */

const DEFAULT_GUEST_LIMIT = 5;
const DEFAULT_FREE_LIMIT = 15;
export const GUEST_LIMIT_SETTING_KEY = "guest_message_limit";

function currentPeriodBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// Guest limit lives in the generic SiteSetting table rather than a new
// column, since it's the one limit that isn't tied to a PricingPlan.
export async function getGuestMessageLimit(): Promise<number> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: GUEST_LIMIT_SETTING_KEY }
    });
    const value = setting?.value;
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  } catch (error) {
    console.error("getGuestMessageLimit failed:", error);
  }
  return DEFAULT_GUEST_LIMIT;
}

// A signed-in user's limit comes from their active subscription's plan, or
// the "free" plan if they don't have one — both fully admin-configurable
// via PricingPlan, never hardcoded here except as a last-resort fallback if
// the free plan itself has been deleted/misconfigured.
export async function getUserMessageLimit(userId: string): Promise<number> {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" }
    });
    if (activeSubscription?.plan?.enabled) {
      return activeSubscription.plan.messageAllowance;
    }

    const freePlan = await prisma.pricingPlan.findUnique({ where: { slug: "free" } });
    if (freePlan?.enabled) return freePlan.messageAllowance;
  } catch (error) {
    console.error("getUserMessageLimit failed:", error);
  }
  return DEFAULT_FREE_LIMIT;
}

export type UsageIdentity = { userId: string | null; guestToken: string | null };

export type UsageCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
};

// Checks the current period's usage against the identity's limit and, only
// if allowed, atomically consumes one message — so a rejected attempt never
// counts against the limit, and a race between two simultaneous requests
// can't both slip through under the cap.
export async function checkAndConsumeMessage(identity: UsageIdentity): Promise<UsageCheckResult> {
  const limit = identity.userId
    ? await getUserMessageLimit(identity.userId)
    : await getGuestMessageLimit();

  const { start, end } = currentPeriodBounds();

  try {
    return await prisma.$transaction(async (tx) => {
      const where = identity.userId
        ? { userId_periodStart: { userId: identity.userId, periodStart: start } }
        : { guestToken_periodStart: { guestToken: identity.guestToken!, periodStart: start } };

      let record = await tx.usageRecord.findUnique({ where });
      if (!record) {
        record = await tx.usageRecord.create({
          data: {
            userId: identity.userId,
            guestToken: identity.userId ? null : identity.guestToken,
            periodStart: start,
            periodEnd: end,
            messageCount: 0
          }
        });
      }

      if (record.messageCount >= limit) {
        return { allowed: false, used: record.messageCount, limit, remaining: 0 };
      }

      const updated = await tx.usageRecord.update({
        where: { id: record.id },
        data: { messageCount: { increment: 1 } }
      });

      return {
        allowed: true,
        used: updated.messageCount,
        limit,
        remaining: Math.max(0, limit - updated.messageCount)
      };
    });
  } catch (error) {
    console.error("checkAndConsumeMessage failed:", error);
    // Fail open would let usage run uncapped; fail closed is the safer
    // default for a cost-bearing external API call.
    return { allowed: false, used: 0, limit, remaining: 0 };
  }
}

// Read-only status (no consumption) — used by /account to show "X of Y used
// this period" without spending a message just by looking.
export async function getUsageStatus(identity: UsageIdentity): Promise<{ used: number; limit: number }> {
  const limit = identity.userId
    ? await getUserMessageLimit(identity.userId)
    : await getGuestMessageLimit();

  try {
    const { start } = currentPeriodBounds();
    const where = identity.userId
      ? { userId_periodStart: { userId: identity.userId, periodStart: start } }
      : { guestToken_periodStart: { guestToken: identity.guestToken!, periodStart: start } };
    const record = await prisma.usageRecord.findUnique({ where });
    return { used: record?.messageCount ?? 0, limit };
  } catch (error) {
    console.error("getUsageStatus failed:", error);
    return { used: 0, limit };
  }
}
