import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminComparisonsPage() {
  const comparisons = await prisma.comparison.findMany({
    orderBy: { createdAt: "desc" },
    include: { products: { include: { product: { select: { name: true } } } } }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">Comparisons</h1>
        <Link
          href="/admin/comparisons/new"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          New comparison
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Featured</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {comparisons.map((c: (typeof comparisons)[number]) => (
              <tr key={c.id} className="hover:bg-parchment-200/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/comparisons/${c.id}`} className="font-medium text-ink-900 hover:underline">
                    {c.title}
                  </Link>
                  <p className="text-xs text-ink-300">/compare/{c.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">
                  {c.products.map((p: (typeof c.products)[number]) => p.product.name).join(", ")}
                </td>
                <td className="px-4 py-3 text-ink-500">{c.featured ? "Yes" : "—"}</td>
              </tr>
            ))}
            {comparisons.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-300">
                  No comparisons yet.{" "}
                  <Link href="/admin/comparisons/new" className="text-trust-700 underline">
                    Create one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
