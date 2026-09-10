import Link from "next/link";
import { listComparisons } from "@/lib/services/comparisons";

// ISR — doesn't read cookies/session, and comparison admin actions already
// revalidatePath("/compare") on every create/edit/delete.
export const revalidate = 300;
export const metadata = { title: "Comparisons" };

export default async function ComparisonsIndexPage() {
  const comparisons = await listComparisons();

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl text-ink-900">Comparisons</h1>
      <p className="mt-2 text-ink-500">
        Side-by-side, spec-for-spec — no marketing spin, just what&apos;s actually
        different.
      </p>

      <div className="mt-8 space-y-3">
        {comparisons.map((c: (typeof comparisons)[number]) => (
          <Link
            key={c.id}
            href={`/compare/${c.slug}`}
            className="block rounded-xl border border-ink-100 bg-surface p-5 shadow-soft transition hover:shadow-lifted"
          >
            <h2 className="font-display text-lg text-ink-900">{c.title}</h2>
            {c.description && <p className="mt-1 text-sm text-ink-500">{c.description}</p>}
            <p className="mt-2 text-xs text-ink-300">
              {c.products.map((p: (typeof c.products)[number]) => p.product.name).join(" vs. ")}
            </p>
          </Link>
        ))}
        {comparisons.length === 0 && (
          <p className="text-sm text-ink-300">No comparisons published yet.</p>
        )}
      </div>
    </div>
  );
}
