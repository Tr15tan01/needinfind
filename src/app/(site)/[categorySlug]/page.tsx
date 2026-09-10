import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/services/catalog";
import { ProductCard } from "@/components/product-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { JsonLd } from "@/components/structured-data";

// ISR — doesn't read cookies/session, and category/product admin actions
// call revalidatePath for this exact route on every relevant change.
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};

  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: `${SITE_URL}/${category.slug}` }
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const category = await getCategoryBySlug(categorySlug);
  // A category with a parent isn't a top-level route — /computers/laptops
  // is served by the subcategory route instead, so treat this as a 404.
  if (!category || category.parentId) notFound();

  const { products, pageCount } = await getProductsByCategory(category.id, {
    page,
    includeSubcategories: true
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: category.name, item: `${SITE_URL}/${category.slug}` }
          ]
        }}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.name }]} />

      <h1 className="mt-3 font-display text-3xl text-ink-900">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-ink-500">{category.description}</p>
      )}

      {category.subcategories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {category.subcategories.map((sub: { id: string; slug: string; name: string }) => (
            <Link
              key={sub.id}
              href={`/${category.slug}/${sub.slug}`}
              className="rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-trust-500 hover:text-trust-700"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {products.length > 0 ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} basePath={`/${category.slug}`} />
        </>
      ) : (
        <p className="mt-10 text-sm text-ink-300">
          No published products in this category yet.
        </p>
      )}
    </div>
  );
}
