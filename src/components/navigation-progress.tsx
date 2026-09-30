"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Immediate feedback when a link is clicked. Next.js keeps the old page on
 * screen until the new one's server work is done, so on pages without a
 * skeleton nothing seemed to happen. This shows a top progress bar right
 * away and a small spinner if the wait lasts more than a moment. It hides
 * as soon as the URL changes — which is also the moment a page's skeleton
 * (loading.tsx) appears, so skeletons are left as they are.
 */
function Progress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Navigation finished (URL changed) → hide everything.
  useEffect(() => {
    clearTimers();
    setActive(false);
    setShowSpinner(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function start() {
      clearTimers();
      setActive(true);
      // Short delay so fast navigations don't flash a spinner.
      timers.current.push(window.setTimeout(() => setShowSpinner(true), 250));
      // Safety net: never leave the indicator stuck if something odd happens.
      timers.current.push(
        window.setTimeout(() => {
          setActive(false);
          setShowSpinner(false);
        }, 20000)
      );
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or just a #hash jump) — no navigation to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      // Affiliate redirects open elsewhere; don't spin for those.
      if (url.pathname.startsWith("/go/") || url.pathname.startsWith("/api/")) return;

      start();
    }

    // Search-style forms (method GET, e.g. the homepage "Ask AI" box)
    // navigate too — show the indicator for those as well.
    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.method.toLowerCase() !== "get") return;
      const url = new URL(form.action || window.location.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      clearTimers();
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="nav-progress-bar h-full w-1/3 rounded-full bg-gradient-to-r from-trust-500 via-gold-500 to-trust-500" />
      </div>

      {showSpinner && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-[100] -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-ink-100 bg-surface/95 px-4 py-2 text-sm text-ink-700 shadow-lifted backdrop-blur">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-100 border-t-trust-500" />
            Loading…
          </div>
        </div>
      )}
    </>
  );
}

export function NavigationProgress() {
  // useSearchParams needs a Suspense boundary so it doesn't opt the whole
  // tree out of static rendering.
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  );
}
