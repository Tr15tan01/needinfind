import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostForm } from "../post-form";
import { updatePost, deletePost } from "../actions";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: true, tags: true }
  });
  if (!post) notFound();

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updatePost(id, formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">{post.title}</h1>
        <form
          action={async () => {
            "use server";
            await deletePost(id);
          }}
        >
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Delete post
          </button>
        </form>
      </div>

      <BlogPostForm
        action={boundUpdate}
        submitLabel="Save changes"
        values={{
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage,
          author: post.author,
          status: post.status,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          canonicalUrl: post.canonicalUrl,
          categoryName: post.category?.name ?? "",
          tags: post.tags.map((t: (typeof post.tags)[number]) => t.name).join(", "),
          relatedProductIds: Array.isArray(post.relatedProductIds)
            ? (post.relatedProductIds as string[])
            : [],
          relatedComparisonIds: Array.isArray(post.relatedComparisonIds)
            ? (post.relatedComparisonIds as string[])
            : []
        }}
      />
    </div>
  );
}
