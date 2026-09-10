import { getSafeSession } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { startCheckout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [plans, session] = await Promise.all([
    prisma.pricingPlan.findMany({ where: { enabled: true }, orderBy: { order: "asc" } }),
    getSafeSession()
  ]);

  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
  const activeSubscription = userId
    ? await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { plan: true },
        orderBy: { createdAt: "desc" }
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-center font-display text-3xl text-ink-900">Pricing</h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-ink-500">
        Browsing and comparing products is always free. These plans are only for a
        higher AI assistant message allowance.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {plans.map((plan: (typeof plans)[number]) => {
          const isCurrent = activeSubscription?.planId === plan.id;
          const isFree = Number(plan.price) <= 0;
          const boundCheckout = async () => {
            "use server";
            await startCheckout(plan.id);
          };

          return (
            <div
              key={plan.id}
              className="flex flex-col rounded-xl border border-ink-100 bg-surface p-6 shadow-soft"
            >
              <p className="font-display text-lg text-ink-900">{plan.name}</p>
              <p className="mt-2 text-3xl font-semibold text-ink-900">
                {isFree ? "Free" : `$${Number(plan.price)}`}
                {!isFree && (
                  <span className="text-sm font-normal text-ink-300">
                    /{plan.billingInterval === "YEARLY" ? "year" : "month"}
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {plan.messageAllowance} AI messages / {plan.billingInterval === "YEARLY" ? "year" : "month"}
              </p>

              <div className="mt-6 flex-1" />

              {isCurrent ? (
                <span className="rounded-full bg-trust-100 px-4 py-2 text-center text-sm font-medium text-trust-700">
                  Current plan
                </span>
              ) : isFree ? (
                <span className="rounded-full border border-ink-100 px-4 py-2 text-center text-sm text-ink-300">
                  Default for new accounts
                </span>
              ) : (
                <form action={boundCheckout}>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {plans.length === 0 && (
          <p className="text-sm text-ink-300 sm:col-span-3">No plans configured yet.</p>
        )}
      </div>
    </div>
  );
}
