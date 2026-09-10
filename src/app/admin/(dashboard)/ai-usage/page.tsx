import { prisma } from "@/lib/prisma";
import { getGuestMessageLimit } from "@/lib/services/usage";
import { updateGuestLimit } from "./actions";

function currentPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export default async function AdminAiUsagePage() {
  const [guestLimit, freePlan, topUsage] = await Promise.all([
    getGuestMessageLimit(),
    prisma.pricingPlan.findUnique({ where: { slug: "free" } }),
    prisma.usageRecord.findMany({
      where: { periodStart: currentPeriodStart() },
      orderBy: { messageCount: "desc" },
      take: 20,
      include: { user: { select: { email: true, name: true } } }
    })
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">AI usage</h1>
      <p className="mt-1 text-sm text-ink-500">
        Limits are enforced server-side on every assistant request — this page
        just controls the numbers, not the enforcement.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <h2 className="font-display text-lg text-ink-900">Guest limit</h2>
          <p className="mt-1 text-sm text-ink-500">
            Free messages per month for visitors who haven&apos;t signed in.
          </p>
          <form action={updateGuestLimit} className="mt-4 flex items-center gap-2">
            <input
              type="number"
              name="guestLimit"
              min={0}
              defaultValue={guestLimit}
              className="w-24 rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
            >
              Save
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <h2 className="font-display text-lg text-ink-900">Free plan (registered)</h2>
          <p className="mt-1 text-sm text-ink-500">
            {freePlan
              ? `${freePlan.messageAllowance} messages/month`
              : "No \"free\" plan found — registered users without a subscription will fall back to a hardcoded default."}
          </p>
          <p className="mt-2 text-xs text-ink-300">
            Edit message allowances per plan on the{" "}
            <a href="/admin/pricing-plans" className="text-trust-700 underline">
              Pricing plans
            </a>{" "}
            page.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink-900">This period&apos;s top usage</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
              <tr>
                <th className="px-4 py-3 font-medium">Identity</th>
                <th className="px-4 py-3 font-medium">Messages used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {topUsage.map((record: (typeof topUsage)[number]) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-ink-900">
                    {record.user?.email ?? record.user?.name ?? (record.guestToken ? `Guest ${record.guestToken.slice(0, 8)}…` : "Unknown")}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{record.messageCount}</td>
                </tr>
              ))}
              {topUsage.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ink-300">
                    No AI usage recorded yet this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
