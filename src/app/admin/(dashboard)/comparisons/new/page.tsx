import { prisma } from "@/lib/prisma";
import { createComparison } from "../actions";

export default async function NewComparisonPage() {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, brand: true }
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">New comparison</h1>

      <form action={createComparison} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input name="title" required placeholder="MacBook Air vs Dell XPS 13" className={inputClass} />
          </Field>
          <Field label="Slug (optional)">
            <input name="slug" className={inputClass} />
          </Field>
        </div>

        <Field label="Description">
          <textarea name="description" rows={3} className={inputClass} />
        </Field>

        <Field label="Products to compare (select at least 2)">
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-ink-100 p-3">
            {products.map((p: (typeof products)[number]) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" name="productIds" value={p.id} className="h-4 w-4 rounded border-ink-100" />
                {p.name}
                {p.brand && <span className="text-ink-300"> — {p.brand}</span>}
              </label>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-ink-300">No published products yet.</p>
            )}
          </div>
        </Field>

        <Field label="Row order override — one spec label per line (optional; derived automatically if left blank)">
          <textarea
            name="fields"
            rows={4}
            placeholder={"CPU\nRAM\nStorage\nOperating System"}
            className={`${inputClass} font-mono text-xs`}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="featured" className="h-4 w-4 rounded border-ink-100" />
          Featured on homepage
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO title">
            <input name="seoTitle" className={inputClass} />
          </Field>
          <Field label="SEO description">
            <input name="seoDescription" className={inputClass} />
          </Field>
        </div>

        <button
          type="submit"
          className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Create comparison
        </button>
      </form>
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
