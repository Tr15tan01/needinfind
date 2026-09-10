"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-xl text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        This admin page hit an unexpected error — nothing on the public site is
        affected. {error.digest && <>Error reference: {error.digest}</>}
      </p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Try again
        </button>
        <a
          href="/admin"
          className="rounded-full border border-ink-100 px-4 py-2 text-sm text-ink-700 transition hover:border-trust-500"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
