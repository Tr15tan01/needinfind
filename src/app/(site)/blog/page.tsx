import Link from "next/link";
import { getPublishedPosts } from "@/lib/services/blog";
import { Pagination } from "@/components/pagination";

// ISR — doesn't read cookies/session, and blog admin actions already
// revalidatePath("/blog") on every publish/edit/delete.
export const revalidate = 300;
export const metadata = { title: "Blog & buying guides" };

export default async function BlogIndexPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { posts, pageCount } = await getPublishedPosts(page);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl text-ink-900">Blog & buying guides</h1>
      <p className="mt-2 text-ink-500">
        Genuinely useful explainers, not thin affiliate filler — the same objective
        approach the assistant takes, written out.
      </p>

      <div className="mt-8 space-y-6">
        {posts.map((post: (typeof posts)[number]) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block rounded-xl border border-ink-100 bg-surface p-5 shadow-soft transition hover:shadow-lifted"
          >
            {post.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-trust-500">
                {post.category.name}
              </p>
            )}
            <h2 className="mt-1 font-display text-xl text-ink-900">{post.title}</h2>
            {post.excerpt && <p className="mt-1.5 text-sm text-ink-500">{post.excerpt}</p>}
            {post.publishedAt && (
              <p className="mt-2 text-xs text-ink-300">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            )}
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-ink-300">No articles published yet.</p>
        )}
      </div>

      <Pagination page={page} pageCount={pageCount} basePath="/blog" />
    </div>
  );
}
