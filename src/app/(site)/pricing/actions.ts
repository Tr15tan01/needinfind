"use server";

import { redirect } from "next/navigation";
import { getSafeSession } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Deliberately builds the Stripe line item from `price_data` at checkout
 * time rather than requiring a pre-created Stripe Price ID stored on
 * PricingPlan. That keeps PricingPlan the single source of truth (spec
 * §13: admin changes pricing without touching code or another system) —
 * editing a plan's price in Admin → Pricing plans takes effect on the next
 * checkout with no Stripe dashboard step required. The tradeoff: Stripe's
 * own dashboard won't show a reusable "Product" for each plan, just the
 * ad-hoc prices generated per checkout — acceptable for this MVP.
 */
export async function startCheckout(planId: string) {
  const session = await getSafeSession();
  if (!session?.user) redirect("/login?from=/pricing");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const [plan, user] = await Promise.all([
    prisma.pricingPlan.findUnique({ where: { id: planId } }),
    prisma.user.findUnique({ where: { id: userId } })
  ]);

  if (!plan || !plan.enabled) throw new Error("This plan isn't available.");
  if (!user) throw new Error("User not found.");
  if (Number(plan.price) <= 0) throw new Error("This plan doesn't require checkout.");

  const stripe = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email ?? undefined,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency.toLowerCase(),
          unit_amount: Math.round(Number(plan.price) * 100),
          recurring: { interval: plan.billingInterval === "YEARLY" ? "year" : "month" },
          product_data: {
            name: `NeedInFind — ${plan.name} plan`,
            metadata: { planId: plan.id }
          }
        }
      }
    ],
    success_url: `${SITE_URL}/account?checkout=success`,
    cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
    metadata: { planId: plan.id, userId: user.id }
  });

  if (!checkoutSession.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(checkoutSession.url);
}

// Immediate cancellation, not cancel-at-period-end — simpler for MVP and
// avoids needing an extra "scheduled to cancel" state in the schema. See
// README for the tradeoff this implies.
export async function cancelActiveSubscription() {
  const session = await getSafeSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
  if (!userId) redirect("/login");

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" }
  });
  if (!subscription?.providerSubscriptionId) return;

  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscription.providerSubscriptionId);
  // Local status is updated by the customer.subscription.deleted webhook,
  // not here — Stripe stays the single source of truth for billing state.
}
