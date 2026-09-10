"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side errors already log via console.error at the throw site
    // throughout the codebase; this covers the render-time failures that
    // only surface here, so nothing goes unlogged.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl text-ink-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">
        This page hit an unexpected error. You can try again, or head back home — the
        rest of the site is unaffected.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-ink-100 px-4 py-2 text-sm text-ink-700 transition hover:border-trust-500"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
