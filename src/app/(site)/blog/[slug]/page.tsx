import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/services/blog";
import { renderMarkdown } from "@/lib/markdown";
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
  const result = await getPostBySlug(slug);
  if (!result) return {};
  const { post } = result;

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: post.canonicalUrl ?? `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      images: post.featuredImage ? [post.featuredImage] : undefined
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) notFound();
  const { post, relatedProducts, relatedComparisons } = result;

  const session = await getSafeSession();
  const userId = session?.user ? (session.user as { id?: string }).id ?? null : null;
  recordEvent(
    "BLOG_VIEW",
    { userId, guestToken: userId ? null : await getGuestToken() },
    { postId: post.id }
  );

  const html = renderMarkdown(post.content);

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.featuredImage ?? undefined,
          author: post.author ? { "@type": "Person", name: post.author } : undefined,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` }
          ]
        }}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

      {post.category && (
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-trust-500">
          {post.category.name}
        </p>
      )}
      <h1 className="mt-1 font-display text-3xl text-ink-900">{post.title}</h1>
      <p className="mt-2 text-sm text-ink-300">
        {post.author && <>By {post.author} · </>}
        {post.publishedAt &&
          new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
      </p>

      {post.featuredImage && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-parchment-200">
          <Image src={post.featuredImage} alt={post.title} fill sizes="700px" className="object-cover" />
        </div>
      )}

      <article
        className="prose prose-neutral mt-8 max-w-none prose-headings:font-display prose-a:text-trust-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag: (typeof post.tags)[number]) => (
            <span key={tag.id} className="rounded-full bg-parchment-200 px-3 py-1 text-xs text-ink-500">
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {(relatedProducts.length > 0 || relatedComparisons.length > 0) && (
        <section className="mt-12 border-t border-ink-100 pt-8">
          <h2 className="font-display text-lg text-ink-900">Related</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedProducts.map((p: (typeof relatedProducts)[number]) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="rounded-full border border-ink-100 bg-surface px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-trust-500 hover:text-trust-700"
              >
                {p.name}
              </Link>
            ))}
            {relatedComparisons.map((c: (typeof relatedComparisons)[number]) => (
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
    </div>
  );
}
