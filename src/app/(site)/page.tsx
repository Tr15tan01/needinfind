import Link from "next/link";
import { getFeaturedProducts, getFeaturedCategories } from "@/lib/services/catalog";
import { listComparisons } from "@/lib/services/comparisons";
import { getRecentPosts } from "@/lib/services/blog";
import { ProductCard } from "@/components/product-card";

// Cached with ISR rather than force-dynamic: this page doesn't read
// cookies/session, so it's a safe caching candidate, and admin actions
// (products, categories, comparisons, blog, homepage) already call
// revalidatePath("/") on every relevant change — this interval is just the
// backstop for anything that slips through.
export const revalidate = 60;

const FALLBACK_CATEGORIES = [
  { name: "Computers", hint: "Laptops, desktops, monitors" },
  { name: "Tools", hint: "Drills, saws, workshop gear" },
  { name: "Kitchen", hint: "Appliances, cookware" },
  { name: "Outdoor", hint: "Grills, garden, camping" }
];

export default async function HomePage() {
  const [featuredProducts, featuredCategories, featuredComparisons, recentPosts] = await Promise.all([
    getFeaturedProducts(3),
    getFeaturedCategories(4),
    listComparisons({ featuredOnly: true }),
    getRecentPosts(3)
  ]);

  return (
    <>
      {/* HERO — signature element: a running dialogue, not a search bar */}
      <section id="assistant" className="relative overflow-hidden border-b border-ink-100">
        {/* Decorative depth: soft glow + fine dot grid, kept subtle so the
            composer stays the visual focus rather than competing with it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(closest-side,_rgb(var(--color-trust-500)/0.14),_transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(theme(colors.ink.100)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
        />

        <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-trust-500/25 bg-trust-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-trust-700">
            An adviser, not an aisle
          </p>
          <h1 className="text-balance font-display text-5xl italic leading-[1.1] text-ink-900 sm:text-6xl">
            Tell us what you need.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-ink-500">
            Describe what you&apos;re looking for, even if you don&apos;t know exactly
            what it&apos;s called. We&apos;ll ask a few questions and point you to the
            right product.
          </p>

          <form
            action="/assistant"
            method="GET"
            className="mx-auto mt-10 max-w-xl rounded-2xl border border-ink-100 bg-surface p-2 text-left shadow-lifted ring-1 ring-ink-900/[0.02]"
          >
            <label htmlFor="need" className="sr-only">
              Describe what you need
            </label>
            <textarea
              id="need"
              name="q"
              rows={2}
              placeholder="I need a laptop for programming, under $1,000…"
              className="w-full resize-none rounded-lg border-0 bg-transparent px-3.5 py-3.5 text-ink-900 placeholder:text-ink-300 focus:outline-none"
            />
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-ink-300">
                <span className="h-1.5 w-1.5 rounded-full bg-trust-500" aria-hidden />
                Grounded in our catalog — no invented products
              </span>
              <button
                type="submit"
                className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition hover:bg-gold-700 hover:text-parchment"
              >
                Ask AI
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Describe the problem",
              body: "Skip the product jargon. Tell us what you're trying to get done."
            },
            {
              step: "02",
              title: "Answer a question or two",
              body: "The assistant narrows things down — budget, preferences, constraints."
            },
            {
              step: "03",
              title: "Compare real options",
              body: "See matching products from our catalog, with honest tradeoffs."
            }
          ].map((s) => (
            <div key={s.title} className="relative pl-1">
              <span className="font-display text-sm text-gold-700">{s.step}</span>
              <h3 className="mt-1 font-display text-lg text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="border-t border-ink-100 bg-parchment-200/60">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-trust-500">
                  Hand-picked
                </p>
                <h2 className="mt-1.5 font-display text-2xl text-ink-900">
                  A few products worth knowing about
                </h2>
              </div>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED CATEGORIES */}
      <section className={featuredProducts.length > 0 ? "" : "border-t border-ink-100 bg-parchment-200/60"}>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-2xl text-ink-900">Browse by category</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(featuredCategories.length > 0
              ? featuredCategories.map((c) => ({ name: c.name, hint: c.description ?? "" }))
              : FALLBACK_CATEGORIES
            ).map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-ink-100 bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
              >
                <p className="font-medium text-ink-900">{c.name}</p>
                {c.hint && <p className="mt-1 text-sm text-ink-500">{c.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON HIGHLIGHT */}
      {featuredComparisons.length > 0 && (
        <section className="border-t border-ink-100">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-2xl text-ink-900">Head-to-head comparisons</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featuredComparisons.slice(0, 4).map((c: (typeof featuredComparisons)[number]) => (
                <Link
                  key={c.id}
                  href={`/compare/${c.slug}`}
                  className="rounded-xl border border-ink-100 bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
                >
                  <p className="font-display text-base text-ink-900">{c.title}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {c.products.map((p: (typeof c.products)[number]) => p.product.name).join(" vs. ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BLOG HIGHLIGHT */}
      {recentPosts.length > 0 && (
        <section className="border-t border-ink-100 bg-parchment-200/60">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-2xl text-ink-900">From the blog</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {recentPosts.map((post: (typeof recentPosts)[number]) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="rounded-xl border border-ink-100 bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted"
                >
                  <p className="font-display text-base text-ink-900">{post.title}</p>
                  {post.excerpt && <p className="mt-1.5 text-sm text-ink-500">{post.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AFFILIATE TRUST NOTE */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-2 text-sm text-ink-300">
        <p>
          NeedInFind links to retailer partners such as Amazon and Best Buy. We may earn a
          commission on qualifying purchases at no extra cost to you — this never changes
          which products the assistant recommends.{" "}
          <Link href="#" className="underline hover:text-ink-500">
            Read our affiliate disclosure
          </Link>
          .
        </p>
      </section>
    </>
  );
}
