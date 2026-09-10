import { prisma } from "@/lib/prisma";
import { toggleSectionVisible, updateHeroCopy } from "./actions";

export default async function AdminHomepagePage() {
  const [hero, sections, featuredProducts, featuredCategories] = await Promise.all([
    prisma.homepageSection.findUnique({ where: { id: "hero" } }),
    prisma.homepageSection.findMany({ orderBy: { order: "asc" } }),
    prisma.product.findMany({ where: { featured: true, status: "PUBLISHED" }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { featured: true, enabled: true }, select: { id: true, name: true } })
  ]);

  const otherSections = sections.filter((s) => s.id !== "hero");

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">Homepage</h1>
      <p className="mt-1 text-sm text-ink-500">
        The hero copy is editable here. Featured products/categories are controlled from
        the &quot;Featured&quot; checkbox on each product/category — this keeps one source
        of truth instead of a duplicate homepage picker.
      </p>

      <div className="mt-6 rounded-lg border border-ink-100 bg-surface p-5">
        <h2 className="font-display text-lg text-ink-900">Hero copy</h2>
        <form action={updateHeroCopy} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Headline</span>
            <input
              name="title"
              defaultValue={hero?.title ?? "Tell us what you need."}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">Supporting text</span>
            <textarea
              name="body"
              rows={2}
              defaultValue={
                hero?.body ??
                "Describe what you're looking for, even if you don't know exactly what it's called."
              }
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
          >
            Save
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <h3 className="font-display text-base text-ink-900">
            Featured products ({featuredProducts.length})
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-500">
            {featuredProducts.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
            {featuredProducts.length === 0 && <li>None yet — mark a product Featured.</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-ink-100 bg-surface p-5">
          <h3 className="font-display text-base text-ink-900">
            Featured categories ({featuredCategories.length})
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-500">
            {featuredCategories.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
            {featuredCategories.length === 0 && <li>None yet — mark a category Featured.</li>}
          </ul>
        </div>
      </div>

      {otherSections.length > 0 && (
        <div className="mt-6 rounded-lg border border-ink-100 bg-surface p-5">
          <h2 className="font-display text-lg text-ink-900">Other sections</h2>
          <div className="mt-3 space-y-2">
            {otherSections.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink-900">{s.title ?? s.type}</p>
                  <p className="text-xs text-ink-300">{s.type}</p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await toggleSectionVisible(s.id, !s.visible);
                  }}
                >
                  <button
                    type="submit"
                    className={
                      s.visible
                        ? "rounded-full bg-trust-100 px-2.5 py-1 text-xs font-medium text-trust-700"
                        : "rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-500"
                    }
                  >
                    {s.visible ? "Visible" : "Hidden"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none";
