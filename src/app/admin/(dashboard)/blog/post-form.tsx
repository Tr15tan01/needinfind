import { prisma } from "@/lib/prisma";

type PostFormValues = {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  author?: string | null;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  categoryName?: string;
  tags?: string;
  relatedProductIds?: string[];
  relatedComparisonIds?: string[];
};

export async function BlogPostForm({
  action,
  submitLabel,
  values
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  values?: PostFormValues;
}) {
  const [products, comparisons] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.comparison.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } })
  ]);

  const selectedProductIds = new Set(values?.relatedProductIds ?? []);
  const selectedComparisonIds = new Set(values?.relatedComparisonIds ?? []);

  return (
    <form action={action} className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input name="title" required defaultValue={values?.title} className={inputClass} />
        </Field>
        <Field label="Slug (optional — derived from title if blank)">
          <input name="slug" defaultValue={values?.slug} className={inputClass} />
        </Field>
        <Field label="Category (creates it if new)">
          <input name="categoryName" defaultValue={values?.categoryName ?? ""} className={inputClass} />
        </Field>
        <Field label="Author">
          <input name="author" defaultValue={values?.author ?? ""} className={inputClass} />
        </Field>
        <Field label="Tags (comma-separated)">
          <input name="tags" defaultValue={values?.tags ?? ""} className={inputClass} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={values?.status ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
      </div>

      <Field label="Excerpt">
        <input name="excerpt" defaultValue={values?.excerpt ?? ""} className={inputClass} />
      </Field>

      <Field label="Featured image URL">
        <input name="featuredImage" type="url" defaultValue={values?.featuredImage ?? ""} className={inputClass} />
      </Field>

      <Field label="Content (Markdown)">
        <textarea
          name="content"
          rows={16}
          required
          defaultValue={values?.content ?? ""}
          className={`${inputClass} font-mono text-xs`}
        />
      </Field>

      <Field label="Related products">
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-ink-100 p-3">
          {products.map((p: (typeof products)[number]) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="relatedProductIds"
                value={p.id}
                defaultChecked={selectedProductIds.has(p.id)}
                className="h-4 w-4 rounded border-ink-100"
              />
              {p.name}
            </label>
          ))}
          {products.length === 0 && <p className="text-sm text-ink-300">No published products yet.</p>}
        </div>
      </Field>

      <Field label="Related comparisons">
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-ink-100 p-3">
          {comparisons.map((c: (typeof comparisons)[number]) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                name="relatedComparisonIds"
                value={c.id}
                defaultChecked={selectedComparisonIds.has(c.id)}
                className="h-4 w-4 rounded border-ink-100"
              />
              {c.title}
            </label>
          ))}
          {comparisons.length === 0 && <p className="text-sm text-ink-300">No comparisons yet.</p>}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title">
          <input name="seoTitle" defaultValue={values?.seoTitle ?? ""} className={inputClass} />
        </Field>
        <Field label="SEO description">
          <input name="seoDescription" defaultValue={values?.seoDescription ?? ""} className={inputClass} />
        </Field>
        <Field label="Canonical URL (optional)">
          <input name="canonicalUrl" type="url" defaultValue={values?.canonicalUrl ?? ""} className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink-500">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
