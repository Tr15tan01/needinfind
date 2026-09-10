import { BlogPostForm } from "../post-form";
import { createPost } from "../actions";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">New post</h1>
      <BlogPostForm action={createPost} submitLabel="Create post" />
    </div>
  );
}
