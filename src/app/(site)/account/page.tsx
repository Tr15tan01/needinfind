import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSafeSession } from "@/lib/safe-auth";
import { prisma } from "@/lib/prisma";
import { getUsageStatus } from "@/lib/services/usage";
import { cancelActiveSubscription } from "@/app/(site)/pricing/actions";

export const dynamic = "force-dynamic";


// A protected user feature, per spec §15's "Protected user features".
export default async function AccountPage() {
  const session = await getSafeSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id?: string }).id ?? null;
  const [usage, activeSubscription] = await Promise.all([
    userId ? getUsageStatus({ userId, guestToken: null }) : null,
    userId
      ? prisma.subscription.findFirst({
          where: { userId, status: "ACTIVE" },
          include: { plan: true },
          orderBy: { createdAt: "desc" }
        })
      : null
  ]);

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-2xl text-ink-900">Your account</h1>
      <p className="mt-2 text-sm text-ink-500">
        Signed in as {session.user.name ?? session.user.email}
      </p>

      <div className="mt-8 rounded-lg border border-ink-100 bg-surface p-5">
        <p className="text-sm font-medium text-ink-900">
          {activeSubscription ? `${activeSubscription.plan.name} plan` : "Free plan"}
        </p>
        {activeSubscription ? (
          <>
            <p className="mt-1 text-sm text-ink-500">
              ${Number(activeSubscription.plan.price)}/
              {activeSubscription.plan.billingInterval === "YEARLY" ? "year" : "month"}
              {activeSubscription.currentPeriodEnd &&
                ` · renews ${activeSubscription.currentPeriodEnd.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}`}
            </p>
            <form action={cancelActiveSubscription} className="mt-3">
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Cancel subscription
              </button>
            </form>
          </>
        ) : (
          <Link href="/pricing" className="mt-1 inline-block text-sm text-trust-700 underline">
            View plans →
          </Link>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-ink-100 bg-surface p-5">
        {usage ? (
          <>
            <p className="text-sm font-medium text-ink-900">AI messages this period</p>
            <p className="mt-1 text-sm text-ink-500">
              {usage.used} of {usage.limit} used
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-trust-500"
                style={{ width: `${Math.min(100, (usage.used / Math.max(usage.limit, 1)) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-500">Usage data unavailable right now.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-ink-100 bg-surface p-5">
        <p className="text-sm text-ink-500">
          Saved conversation history lands here once that&apos;s built — nothing
          currently keeps it beyond the assistant&apos;s own conversation record.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
