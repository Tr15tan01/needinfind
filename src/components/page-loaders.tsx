"use client";

import { usePathname } from "next/navigation";

/** Centered spinner for pages that don't have their own skeleton. */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] w-full items-center justify-center px-5 py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-[3px] border-ink-100" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-trust-500 border-r-trust-500" />
          <span className="absolute inset-[14px] animate-pulse rounded-full bg-gold-500" />
        </div>
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </div>
  );
}

/** Skeleton shaped like the homepage (hero, how-it-works, featured products). */
export function HomeSkeleton() {
  return (
    <div className="animate-pulse">
      <section className="border-b border-ink-100">
        <div className="mx-auto max-w-3xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <div className="mx-auto h-6 w-48 rounded-full bg-ink-100" />
          <div className="mx-auto mt-5 h-11 w-4/5 rounded-lg bg-ink-100 sm:h-12" />
          <div className="mx-auto mt-5 max-w-xl space-y-2">
            <div className="mx-auto h-4 w-full rounded bg-ink-100" />
            <div className="mx-auto h-4 w-2/3 rounded bg-ink-100" />
          </div>
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-ink-100 bg-surface p-2 shadow-lifted">
            <div className="h-14 w-full rounded-lg bg-parchment-200" />
            <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
              <div className="h-3 w-40 rounded bg-parchment-200" />
              <div className="h-9 w-24 rounded-full bg-parchment-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 pl-1">
              <div className="h-3 w-6 rounded bg-ink-100" />
              <div className="h-4 w-2/3 rounded bg-ink-100" />
              <div className="h-3 w-full rounded bg-ink-100" />
              <div className="h-3 w-4/5 rounded bg-ink-100" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-parchment-200/60">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="h-3 w-24 rounded bg-ink-100" />
          <div className="mt-2 h-7 w-2/3 max-w-md rounded-lg bg-ink-100" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-ink-100 bg-surface p-4">
                <div className="aspect-[4/3] rounded-lg bg-parchment-200" />
                <div className="h-4 w-3/4 rounded bg-ink-100" />
                <div className="h-3 w-1/2 rounded bg-ink-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Homepage keeps its skeleton; every other page without one gets the spinner. */
export function RouteLoader() {
  const pathname = usePathname();
  return pathname === "/" ? <HomeSkeleton /> : <PageSpinner />;
}
