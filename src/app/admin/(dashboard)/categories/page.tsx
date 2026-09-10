import { prisma } from "@/lib/prisma";
import { createCategory, toggleCategoryEnabled, deleteCategory } from "./actions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { parent: true, _count: { select: { products: true } } }
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Categories</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-ink-100 bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-parchment-200 text-xs uppercase tracking-wide text-ink-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-parchment-200/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-300">/{c.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-500">{c.parent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-500">{c._count.products}</td>
                <td className="px-4 py-3 text-ink-500">{c.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3">
                  <form
                    action={async () => {
                      "use server";
                      await toggleCategoryEnabled(c.id, !c.enabled);
                    }}
                  >
                    <button
                      type="submit"
                      className={
                        c.enabled
                          ? "rounded-full bg-trust-100 px-2.5 py-1 text-xs font-medium text-trust-700"
                          : "rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500"
                      }
                    >
                      {c.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteCategory(c.id);
                    }}
                  >
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-300">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-ink-100 bg-surface p-5">
        <h2 className="font-display text-lg text-ink-900">Add category</h2>
        <form action={createCategory} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Name</span>
            <input name="name" required className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Slug (optional)</span>
            <input name="slug" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Parent category</span>
            <select name="parentId" defaultValue="" className={inputClass}>
              <option value="">None (top-level)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Description</span>
            <input name="description" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
            <input type="checkbox" name="featured" className="h-4 w-4 rounded border-ink-100" />
            Featured on homepage
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
            >
              Create category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
