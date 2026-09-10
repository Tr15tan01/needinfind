import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";
import { getComparisonsForProduct } from "@/lib/services/comparisons";
import { getPostsForProduct } from "@/lib/services/blog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
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
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `${SITE_URL}/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription ?? undefined,
      images: product.images[0]?.url ? [product.images[0].url] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId);
  const comparisons = await getComparisonsForProduct(product.id);
  const articles = await getPostsForProduct(product.id);

  const session = await getSafeSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
  recordEvent(
    "PRODUCT_VIEW",
    { userId, guestToken: userId ? null : await getGuestToken() },
    { productId: product.id }
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription ?? undefined,
          brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
          image: product.images[0]?.url ?? undefined,
          offers: product.offers.map((offer) => ({
            "@type": "Offer",
            url: offer.affiliateUrl,
            priceCurrency: offer.currency,
            price: offer.displayPrice ? Number(offer.displayPrice) : undefined,
            availability:
              offer.availability === "IN_STOCK"
                ? "https://schema.org/InStock"
                : offer.availability === "OUT_OF_STOCK"
                  ? "https://schema.org/OutOfStock"
                  : undefined,
            seller: { "@type": "Organization", name: offer.retailer.name }
          }))
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: product.category?.name,
              item: `${SITE_URL}/${product.category?.slug ?? ""}`
            },
            { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/products/${product.slug}` }
          ]
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.category?.name ?? "Category", href: `/${product.category?.slug ?? ""}` },
          { label: product.name }
        ]}
      />

      <p className="mt-3 text-xs uppercase tracking-wide text-ink-300">
        {product.category?.name}
      </p>

      <div className="mt-3 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-ink-100 bg-parchment-200">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-300">
              No image yet
            </div>
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-sm font-medium uppercase tracking-wide text-trust-500">
              {product.brand}
            </p>
          )}
          <h1 className="mt-1 font-display text-3xl text-ink-900">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-3 text-ink-500">{product.shortDescription}</p>
          )}

          {product.offers.length > 0 ? (
            <div className="mt-6 space-y-2.5">
              {product.offers.map((offer) => (
                <a
                  key={offer.id}
                  href={`/go/${offer.id}?from=/products/${product.slug}`}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="flex items-center justify-between rounded-xl border border-ink-100 bg-surface px-4 py-3.5 shadow-soft transition hover:shadow-lifted"
                >
                  <div>
                    <p className="font-medium text-ink-900">View on {offer.retailer.name}</p>
                    {offer.availability === "OUT_OF_STOCK" && (
                      <p className="text-xs text-ink-300">Currently out of stock</p>
                    )}
                  </div>
                  <p className="font-semibold text-ink-900">
                    {offer.displayPrice
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: offer.currency
                        }).format(Number(offer.displayPrice))
                      : "See price"}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink-300">No retailer offers yet.</p>
          )}

          {product.description && (
            <p className="mt-8 text-sm leading-relaxed text-ink-500">{product.description}</p>
          )}

          {product.specifications.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg text-ink-900">Specifications</h2>
              <dl className="mt-3 divide-y divide-ink-100 text-sm">
                {product.specifications.map((spec) => (
                  <div key={spec.id} className="flex justify-between py-2">
                    <dt className="text-ink-500">{spec.label}</dt>
                    <dd className="font-medium text-ink-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {product.features.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {["PRO", "CON"].map((kind) => {
                const items = product.features.filter((f) => f.kind === kind);
                if (items.length === 0) return null;
                return (
                  <div key={kind}>
                    <h3 className="text-sm font-medium text-ink-900">
                      {kind === "PRO" ? "Pros" : "Cons"}
                    </h3>
                    <ul className="mt-1.5 space-y-1 text-sm text-ink-500">
                      {items.map((f) => (
                        <li key={f.id}>• {f.text}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {articles.length > 0 && (
        <section className="mt-14 border-t border-ink-100 pt-10">
          <h2 className="font-display text-xl text-ink-900">Related articles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {articles.map((a: (typeof articles)[number]) => (
              <Link
                key={a.id}
                href={`/blog/${a.slug}`}
                className="rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-trust-500 hover:text-trust-700"
              >
                {a.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {comparisons.length > 0 && (
        <section className="mt-14 border-t border-ink-100 pt-10">
          <h2 className="font-display text-xl text-ink-900">See it compared</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {comparisons.map((c: (typeof comparisons)[number]) => (
              <Link
                key={c.id}
                href={`/compare/${c.slug}`}
                className="rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-trust-500 hover:text-trust-700"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14 border-t border-ink-100 pt-10">
          <h2 className="font-display text-xl text-ink-900">You might also consider</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-xs text-ink-300">
        As an affiliate, NeedInFind may earn a commission from qualifying purchases made
        through the links above.
      </p>
    </div>
  );
}
