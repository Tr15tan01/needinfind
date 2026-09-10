import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-sm italic text-trust-500">404</p>
      <h1 className="mt-2 font-display text-2xl text-ink-900">Page not found</h1>
      <p className="mt-2 text-sm text-ink-500">
        Whatever you were looking for isn&apos;t here — it may have moved, or the link
        might be out of date.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
        >
          Go home
        </Link>
        <Link
          href="/assistant"
          className="rounded-full border border-ink-100 px-4 py-2 text-sm text-ink-700 transition hover:border-trust-500"
        >
          Ask the assistant
        </Link>
      </div>
    </div>
  );
}
