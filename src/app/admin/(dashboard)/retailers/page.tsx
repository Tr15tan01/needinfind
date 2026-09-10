import { prisma } from "@/lib/prisma";
import { createRetailer, toggleRetailerEnabled, deleteRetailer } from "./actions";

export default async function AdminRetailersPage() {
  const retailers = await prisma.retailer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { offers: true } } }
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Retailers</h1>
      <p className="mt-1 text-sm text-ink-500">
        NeedInFind is retailer-neutral — add as many as you like. Offers per product are
        managed from each product&apos;s edit page.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Offers</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {retailers.map((r) => (
              <tr key={r.id} className="hover:bg-parchment-200/50">
                <td className="px-4 py-3 font-medium text-ink-900">{r.name}</td>
                <td className="px-4 py-3 text-ink-500">{r.websiteUrl ?? "—"}</td>
                <td className="px-4 py-3 text-ink-500">{r._count.offers}</td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      "use server";
                      await toggleRetailerEnabled(r.id, !r.enabled);
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        r.enabled
                          ? "rounded-full bg-trust-100 px-2.5 py-1 text-xs font-medium text-trust-700"
                          : "rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500"
                      }
                    >
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteRetailer(r.id);
                    }}
                  >
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {retailers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-300">
                  No retailers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-ink-100 bg-surface p-5">
        <h2 className="font-display text-lg text-ink-900">Add retailer</h2>
        <form action={createRetailer} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Name</span>
            <input name="name" required placeholder="Amazon" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Slug (optional)</span>
            <input name="slug" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Website URL</span>
            <input name="websiteUrl" type="url" placeholder="https://www.amazon.com" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Logo URL</span>
            <input name="logoUrl" type="url" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-ink-500">Affiliate disclosure</span>
            <input
              name="affiliateDisclosure"
              placeholder="As an Amazon Associate, NeedInFind earns from qualifying purchases."
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
            >
              Add retailer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
