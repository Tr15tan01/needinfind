"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment-200 px-4">
      <div className="w-full max-w-sm rounded-xl border border-ink-100 bg-surface p-7 shadow-lifted">
        <p className="flex items-baseline gap-1">
          <span className="font-display text-lg italic text-ink-900">Need</span>
          <span className="font-display text-lg text-trust-700">InFind</span>
        </p>
        <h1 className="mt-4 font-display text-xl text-ink-900">Admin sign in</h1>

        <form action={formAction} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ink-500">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-ink-500">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 focus:border-trust-500 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
