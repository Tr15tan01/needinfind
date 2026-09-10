export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded-lg bg-ink-100" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-ink-100 bg-surface p-4">
              <div className="aspect-[4/3] rounded-lg bg-parchment-200" />
              <div className="h-4 w-3/4 rounded bg-ink-100" />
              <div className="h-3 w-1/2 rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
