import { prisma } from "@/lib/prisma";
import { createPlan, updatePlan, deletePlan } from "./actions";

export default async function AdminPricingPlansPage() {
  const plans = await prisma.pricingPlan.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Pricing plans</h1>
      <p className="mt-1 text-sm text-ink-500">
        Message allowance here is what the AI usage limiter (Phase 6) actually
        enforces. Checkout/payment processing itself is Phase 10 — these plans
        work today for setting limits even without billing wired up.
      </p>

      <div className="mt-6 space-y-3">
        {plans.map((plan: (typeof plans)[number]) => {
          const boundUpdate = async (formData: FormData) => {
            "use server";
            await updatePlan(plan.id, formData);
          };
          const boundDelete = async () => {
            "use server";
            await deletePlan(plan.id);
          };
          return (
            <div key={plan.id} className="rounded-lg border border-ink-100 bg-surface p-4">
              <form action={boundUpdate} className="grid items-end gap-3 sm:grid-cols-5">
                <div>
                  <p className="text-sm font-medium text-ink-900">{plan.name}</p>
                  <p className="text-xs text-ink-300">/{plan.slug}</p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-500">Price ({plan.currency})</span>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={Number(plan.price)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-500">
                    Messages / {plan.billingInterval === "YEARLY" ? "year" : "month"}
                  </span>
                  <input
                    name="messageAllowance"
                    type="number"
                    min={0}
                    defaultValue={plan.messageAllowance}
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={plan.enabled}
                    className="h-4 w-4 rounded border-ink-100"
                  />
                  Enabled
                </label>
                <button
                  type="submit"
                  className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
                >
                  Save
                </button>
              </form>
              <form action={boundDelete} className="mt-2 text-right">
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Delete plan
                </button>
              </form>
            </div>
          );
        })}        {plans.length === 0 && (
          <p className="rounded-lg border border-ink-100 bg-surface p-5 text-sm text-ink-300">
            No plans yet.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-ink-100 bg-surface p-5">
        <h2 className="font-display text-lg text-ink-900">Add plan</h2>
        <form action={createPlan} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Name</span>
            <input name="name" required placeholder="Pro" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Slug (optional)</span>
            <input name="slug" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Price (USD)</span>
            <input name="price" type="number" step="0.01" defaultValue={0} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Billing interval</span>
            <select name="billingInterval" defaultValue="MONTHLY" className={inputClass}>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Message allowance</span>
            <input name="messageAllowance" type="number" min={0} defaultValue={30} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Order</span>
            <input name="order" type="number" defaultValue={plans.length} className={inputClass} />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
            >
              Create plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
