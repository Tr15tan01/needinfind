export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-5 py-12">
      <div className="h-3 w-32 rounded bg-ink-100" />
      <div className="mt-4 h-8 w-1/3 rounded bg-ink-100" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-parchment-200" />
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-ink-100 bg-surface p-4">
            <div className="aspect-[4/3] rounded-lg bg-parchment-200" />
            <div className="h-4 w-3/4 rounded bg-ink-100" />
            <div className="h-3 w-1/2 rounded bg-ink-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
