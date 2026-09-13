import Link from "next/link";

/**
 * Brand mark: a magnifying glass with a gold "found it" dot at its center.
 * Kept as inline SVG (not <img src="/brand/mark.svg">) so it can inherit
 * currentColor-independent fills without an extra network request, and so
 * it stays crisp at the small sizes it's used at in the header.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#171B2E" />
      <circle cx="27" cy="27" r="13" fill="none" stroke="#EEF0F6" strokeWidth="5" />
      <line
        x1="36.5"
        y1="36.5"
        x2="47"
        y2="47"
        stroke="#EEF0F6"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <circle cx="27" cy="27" r="5.5" fill="#C99A4A" />
    </svg>
  );
}

/** Full lockup: icon + "NeedInFind" wordmark, linking home. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-xl italic text-ink-900">Need</span>
        <span className="font-display text-xl text-trust-700">InFind</span>
      </span>
    </Link>
  );
}
