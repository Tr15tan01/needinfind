import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateComparison,
  deleteComparison,
  addProductToComparison,
  removeProductFromComparison
} from "../actions";

export default async function EditComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const comparison = await prisma.comparison.findUnique({
    where: { id },
    include: { products: { include: { product: true }, orderBy: { order: "asc" } } }
  });
  if (!comparison) notFound();

  const includedIds = comparison.products.map((cp: (typeof comparison.products)[number]) => cp.productId);
  const availableProducts = await prisma.product.findMany({
    where: { status: "PUBLISHED", id: { notIn: includedIds } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, brand: true }
  });

  const fields = Array.isArray(comparison.fields) ? (comparison.fields as string[]).join("\n") : "";

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updateComparison(id, formData);
  };
  const boundAddProduct = async (formData: FormData) => {
    "use server";
    await addProductToComparison(id, formData);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink-900">{comparison.title}</h1>
        <form
          action={async () => {
            "use server";
            await deleteComparison(id);
          }}
        >
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Delete comparison
          </button>
        </form>
      </div>

      <form action={boundUpdate} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input name="title" required defaultValue={comparison.title} className={inputClass} />
          </Field>
          <Field label="Slug">
            <input name="slug" defaultValue={comparison.slug} className={inputClass} />
          </Field>
        </div>

        <Field label="Description">
          <textarea name="description" rows={3} defaultValue={comparison.description ?? ""} className={inputClass} />
        </Field>

        <Field label="Row order override — one spec label per line (optional; derived automatically if left blank)">
          <textarea name="fields" rows={4} defaultValue={fields} className={`${inputClass} font-mono text-xs`} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="featured" defaultChecked={comparison.featured} className="h-4 w-4 rounded border-ink-100" />
          Featured on homepage
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title">
            <input name="seoTitle" defaultValue={comparison.seoTitle ?? ""} className={inputClass} />
          </Field>
          <Field label="SEO description">
            <input name="seoDescription" defaultValue={comparison.seoDescription ?? ""} className={inputClass} />
          </Field>
        </div>

        <button
          type="submit"
          className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Save changes
        </button>
      </form>

      <section className="mt-10 border-t border-ink-100 pt-8">
        <h2 className="font-display text-lg text-ink-900">Products in this comparison</h2>

        <div className="mt-4 space-y-2">
          {comparison.products.map((cp: (typeof comparison.products)[number]) => (
            <div
              key={cp.id}
              className="flex items-center justify-between rounded-lg border border-ink-100 bg-surface px-4 py-3"
            >
              <p className="text-sm font-medium text-ink-900">{cp.product.name}</p>
              <form
                action={async () => {
                  "use server";
                  await removeProductFromComparison(id, cp.id);
                }}
              >
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>

        <form action={boundAddProduct} className="mt-4 flex items-end gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm text-ink-500">Add a product</span>
            <select name="productId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Select a product
              </option>
              {availableProducts.map((p: (typeof availableProducts)[number]) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.brand ? ` — ${p.brand}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-full bg-trust-500 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-trust-700"
          >
            Add
          </button>
        </form>
      </section>
    </div>
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
