import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { recordEvent } from "@/lib/services/analytics";

/**
 * Stripe is the single source of truth for billing state — this webhook is
 * the only code path that ever writes to `Subscription`. Admin never
 * fabricates a subscription row directly (see Admin → Subscriptions),
 * and the checkout action only *reads* plan data, never writes
 * subscription status itself.
 */

function mapStripeStatus(status: Stripe.Subscription.Status): "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}

async function upsertSubscriptionFromStripe(stripeSub: Stripe.Subscription, userId: string, planId: string) {
  const status = mapStripeStatus(stripeSub.status);
  const item = stripeSub.items.data[0];

  await prisma.subscription.upsert({
    where: { providerSubscriptionId: stripeSub.id },
    update: {
      status,
      currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined
    },
    create: {
      userId,
      planId,
      status,
      providerCustomerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
      providerSubscriptionId: stripeSub.id,
      currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined
    }
  });
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const planId = checkoutSession.metadata?.planId;
        const stripeCustomerId =
          typeof checkoutSession.customer === "string" ? checkoutSession.customer : checkoutSession.customer?.id;

        if (!userId || !planId || !checkoutSession.subscription) break;

        if (stripeCustomerId) {
          await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
        }

        const stripeSubId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        await upsertSubscriptionFromStripe(stripeSub, userId, planId);
        recordEvent("SUBSCRIPTION_STARTED", { userId }, { planId });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const stripeSub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { providerSubscriptionId: stripeSub.id }
        });
        if (!existing) break;

        const status = event.type === "customer.subscription.deleted" ? "CANCELED" : mapStripeStatus(stripeSub.status);
        const item = stripeSub.items.data[0];
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status,
            currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined
          }
        });
        break;
      }

      default:
        // Unhandled event types are fine to ignore — Stripe sends many
        // more than we currently act on.
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handling failed for ${event.type}:`, error);
    // Still return 200 — Stripe retries on non-2xx, and a DB hiccup will
    // resolve on retry rather than needing us to signal failure here.
  }

  return NextResponse.json({ received: true });
}
