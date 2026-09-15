"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && (
        <svg
          className="h-4 w-4 animate-spin text-parchment"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {pending ? (pendingLabel ?? label) : label}
    </button>
  );
}
