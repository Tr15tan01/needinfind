import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComparisonBySlug } from "@/lib/services/comparisons";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/structured-data";
import { getSafeSession } from "@/lib/safe-auth";
import { getGuestToken } from "@/lib/guest-session";
import { recordEvent } from "@/lib/services/analytics";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);
  if (!comparison) return {};

  return {
    title: comparison.seoTitle ?? comparison.title,
    description: comparison.seoDescription ?? comparison.description ?? undefined,
    alternates: { canonical: `${SITE_URL}/compare/${comparison.slug}` }
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);
  if (!comparison) notFound();

  const session = await getSafeSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
  recordEvent(
    "COMPARISON_VIEW",
    { userId, guestToken: userId ? null : await getGuestToken() },
    { comparisonId: comparison.id }
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Comparisons", item: `${SITE_URL}/compare` },
            { "@type": "ListItem", position: 3, name: comparison.title, item: `${SITE_URL}/compare/${comparison.slug}` }
          ]
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Comparisons", href: "/compare" },
          { label: comparison.title }
        ]}
      />

      <h1 className="mt-3 font-display text-3xl text-ink-900">{comparison.title}</h1>
      {comparison.description && (
        <p className="mt-2 max-w-2xl text-ink-500">{comparison.description}</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-ink-100 bg-surface shadow-soft">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[140px] border-b border-ink-100 bg-parchment-200 px-4 py-3 text-left font-medium text-ink-500">
                &nbsp;
              </th>
              {comparison.products.map((p) => (
                <th
                  key={p.id}
                  className="min-w-[180px] border-b border-l border-ink-100 bg-parchment-200 px-4 py-3 text-left"
                >
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill sizes="200px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-ink-300">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="mt-2 font-display text-sm leading-snug text-ink-900 hover:underline">
                      {p.name}
                    </p>
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-ink-900">
                    {p.lowestPrice
                      ? new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(
                          p.lowestPrice
                        )
                      : "See price"}
                  </p>
                  <Link
                    href={`/products/${p.slug}`}
                    className="mt-1 inline-block text-xs font-medium text-trust-700 hover:underline"
                  >
                    View product →
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.fields.map((label, i) => (
              <tr key={label} className={i % 2 === 0 ? "bg-surface" : "bg-parchment-200/40"}>
                <th className="sticky left-0 z-10 border-b border-ink-100 bg-inherit px-4 py-2.5 text-left font-medium text-ink-500">
                  {label}
                </th>
                {comparison.products.map((p) => (
                  <td key={p.id} className="border-b border-l border-ink-100 px-4 py-2.5 text-ink-900">
                    {p.specs[label] ?? <span className="text-ink-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {comparison.fields.length === 0 && (
              <tr>
                <td colSpan={comparison.products.length + 1} className="px-4 py-6 text-center text-ink-300">
                  No specifications recorded for these products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-ink-300">
        As an affiliate, NeedInFind may earn a commission from qualifying purchases made
        through the retailer links on each product&apos;s page.
      </p>
    </div>
  );
}
