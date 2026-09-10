import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getCounts() {
  try {
    const [products, categories, retailers, offers] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.retailer.count(),
      prisma.offer.count()
    ]);
    return { products, categories, retailers, offers, ok: true as const };
  } catch (error) {
    console.error("Admin dashboard counts failed:", error);
    return { products: 0, categories: 0, retailers: 0, offers: 0, ok: false as const };
  }
}

async function getClickSummary() {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const clicks = await prisma.affiliateClick.findMany({
      where: { createdAt: { gte: since } },
      include: { product: { select: { name: true } } }
    });

    const byProduct = new Map<string, { name: string; count: number }>();
    for (const click of clicks as (typeof clicks)[number][]) {
      const existing = byProduct.get(click.productId);
      if (existing) existing.count += 1;
      else byProduct.set(click.productId, { name: click.product.name, count: 1 });
    }

    const top = Array.from(byProduct.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { total: clicks.length, top, ok: true as const };
  } catch (error) {
    console.error("Admin dashboard click summary failed:", error);
    return { total: 0, top: [] as { name: string; count: number }[], ok: false as const };
  }
}

export default async function AdminDashboardPage() {
  const [counts, clickSummary] = await Promise.all([getCounts(), getClickSummary()]);

  const cards = [
    { label: "Products", value: counts.products, href: "/admin/products" },
    { label: "Categories", value: counts.categories, href: "/admin/categories" },
    { label: "Retailers", value: counts.retailers, href: "/admin/retailers" },
    { label: "Offers", value: counts.offers, href: "/admin/retailers" }
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-500">
        Everything on the public site is driven from here — nothing is hardcoded.
      </p>

      {!counts.ok && (
        <p className="mt-4 rounded-lg border border-gold-500/40 bg-gold-100 px-4 py-3 text-sm text-ink-700">
          Couldn&apos;t reach the database. Check <code>DATABASE_URL</code> /{" "}
          <code>DIRECT_URL</code> in your environment.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-ink-100 bg-surface p-5 shadow-soft transition hover:shadow-lifted"
          >
            <p className="text-2xl font-semibold text-ink-900">{c.value}</p>
            <p className="mt-1 text-sm text-ink-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <p className="text-2xl font-semibold text-ink-900">{clickSummary.total}</p>
          <p className="mt-1 text-sm text-ink-500">Affiliate clicks (last 30 days)</p>
        </div>
        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <p className="text-sm font-medium text-ink-900">Top clicked products</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-500">
            {clickSummary.top.map((row) => (
              <li key={row.name} className="flex justify-between">
                <span>{row.name}</span>
                <span className="text-ink-300">{row.count}</span>
              </li>
            ))}
            {clickSummary.top.length === 0 && <li>No clicks recorded yet.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink-900">Quick start</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink-500">
          <li>Add a <Link href="/admin/retailers" className="text-trust-700 underline">retailer</Link> (e.g. Amazon).</li>
          <li>Create a <Link href="/admin/categories" className="text-trust-700 underline">category</Link>.</li>
          <li>Add a <Link href="/admin/products/new" className="text-trust-700 underline">product</Link>, mark it Featured, and attach a retailer offer.</li>
          <li>Featured, published products appear on the homepage automatically.</li>
        </ol>
      </div>
    </div>
  );
}
