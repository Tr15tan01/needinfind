function FieldSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-1 h-3 w-24 rounded bg-ink-100/70" />
      <div className="h-9 w-full rounded-lg bg-ink-100" />
    </div>
  );
}

export default function Loading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-ink-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-ink-100/70" />
      </div>

      <div className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <div className="h-9 w-full animate-pulse rounded-lg bg-ink-100" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-ink-100" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-ink-100" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-ink-100" />
      </div>
    </div>
  );
}
