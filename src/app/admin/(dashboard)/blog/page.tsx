import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">Blog</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          New post
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {posts.map((post: (typeof posts)[number]) => (
              <tr key={post.id} className="hover:bg-parchment-200/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/blog/${post.id}`} className="font-medium text-ink-900 hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-xs text-ink-300">/blog/{post.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">{post.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-500">{post.status}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-300">
                  No posts yet.{" "}
                  <Link href="/admin/blog/new" className="text-trust-700 underline">
                    Write one
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
