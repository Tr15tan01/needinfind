import { prisma } from "@/lib/prisma";

// Read-only by design: Stripe is the single source of truth for billing
// state (src/app/api/webhooks/stripe/route.ts is the only writer). Admin
// can see what's happening but never fabricates or edits a subscription
// row directly — that would drift out of sync with what Stripe actually
// billed.
export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } }, plan: true }
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Subscriptions</h1>
      <p className="mt-1 text-sm text-ink-500">
        Read-only — Stripe is the source of truth. Checkout and cancellation happen
        from the customer-facing <code>/pricing</code> and <code>/account</code> pages.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Renews / ended</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {subscriptions.map((sub: (typeof subscriptions)[number]) => (
              <tr key={sub.id}>
                <td className="px-4 py-3 text-ink-900">{sub.user.email ?? sub.user.name}</td>
                <td className="px-4 py-3 text-ink-500">{sub.plan.name}</td>
                <td className="px-4 py-3 text-ink-500">{sub.status}</td>
                <td className="px-4 py-3 text-ink-500">
                  {sub.currentPeriodEnd
                    ? sub.currentPeriodEnd.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })
                    : "—"}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-300">
                  No subscriptions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
