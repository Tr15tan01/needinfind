"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export function ThemeToggle() {
  // Starts null so the button renders nothing until mounted — the actual
  // theme is already correctly applied to <html> by the blocking script
  // in the document head before this component even runs, so there's no
  // flash; this just avoids a hydration mismatch on the icon itself.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Same locked-down-storage case as theme-script.ts — the toggle
      // still works for this page load, it just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition hover:bg-parchment-200 hover:text-ink-900"
    >
      {isDark === null ? null : isDark ? (
        // Sun icon — shown when dark is active, click to go light.
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.5 4.5l-1 1M5.5 14.5l-1 1M15.5 15.5l-1-1M5.5 5.5l-1-1"
          />
        </svg>
      ) : (
        // Moon icon — shown when light is active, click to go dark.
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M16.5 12.5A7 7 0 018 4.02 7 7 0 1016.5 12.5z"
          />
        </svg>
      )}
    </button>
  );
}
