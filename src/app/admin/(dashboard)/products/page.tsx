import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true, offers: true }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          New product
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Offers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-parchment-200/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-ink-900 hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-300">/{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">{p.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-500">{p.status}</td>
                <td className="px-4 py-3 text-ink-500">{p.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-ink-500">{p.offers.length}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-300">
                  No products yet. <Link href="/admin/products/new" className="text-trust-700 underline">Create one</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
