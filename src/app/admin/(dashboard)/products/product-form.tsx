import { prisma } from "@/lib/prisma";

type ProductFormValues = {
  name?: string;
  slug?: string;
  brand?: string | null;
  model?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  status?: string;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string;
  imageUrl?: string;
  specifications?: string;
  features?: string;
};

export async function ProductForm({
  action,
  submitLabel,
  values
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  values?: ProductFormValues;
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <form action={action} className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required defaultValue={values?.name} className={inputClass} />
        </Field>
        <Field label="Slug (optional — derived from name if blank)">
          <input name="slug" defaultValue={values?.slug} className={inputClass} />
        </Field>
        <Field label="Brand">
          <input name="brand" defaultValue={values?.brand ?? ""} className={inputClass} />
        </Field>
        <Field label="Model">
          <input name="model" defaultValue={values?.model ?? ""} className={inputClass} />
        </Field>
        <Field label="Category">
          <select name="categoryId" required defaultValue={values?.categoryId} className={inputClass}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={values?.status ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="featured" defaultChecked={values?.featured} className="h-4 w-4 rounded border-ink-100" />
        Featured (eligible to show on the homepage)
      </label>

      <Field label="Short description">
        <input name="shortDescription" defaultValue={values?.shortDescription ?? ""} className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea name="description" rows={4} defaultValue={values?.description ?? ""} className={inputClass} />
      </Field>

      <Field label="Primary image URL">
        <input name="imageUrl" type="url" placeholder="https://…" defaultValue={values?.imageUrl ?? ""} className={inputClass} />
      </Field>

      <Field label="Specifications — one per line, Label: Value">
        <textarea
          name="specifications"
          rows={5}
          placeholder={"CPU: Apple M3\nRAM: 16 GB\nStorage: 512 GB SSD"}
          defaultValue={values?.specifications ?? ""}
          className={`${inputClass} font-mono text-xs`}
        />
      </Field>

      <Field label="Features — one per line. Prefix with + for a pro, - for a con">
        <textarea
          name="features"
          rows={4}
          placeholder={"+ Excellent battery life\n- Not upgradeable"}
          defaultValue={values?.features ?? ""}
          className={`${inputClass} font-mono text-xs`}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title">
          <input name="seoTitle" defaultValue={values?.seoTitle ?? ""} className={inputClass} />
        </Field>
        <Field label="SEO description">
          <input name="seoDescription" defaultValue={values?.seoDescription ?? ""} className={inputClass} />
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
