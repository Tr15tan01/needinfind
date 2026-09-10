export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-5 py-12">
      <div className="h-3 w-40 rounded bg-ink-100" />
      <div className="mt-4 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] rounded-xl bg-parchment-200" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-ink-100" />
          <div className="h-8 w-3/4 rounded bg-ink-100" />
          <div className="h-4 w-full rounded bg-ink-100" />
          <div className="mt-6 space-y-2.5">
            <div className="h-14 rounded-xl bg-parchment-200" />
            <div className="h-14 rounded-xl bg-parchment-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
