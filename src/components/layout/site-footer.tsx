import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 bg-parchment-200">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-ink-900">NeedInFind</p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">
              An AI-powered product discovery and decision platform — not a store.
            </p>
          </div>

          <nav aria-label="Explore" className="text-sm">
            <p className="mb-2 font-medium text-ink-900">Explore</p>
            <ul className="space-y-1.5 text-ink-500">
              <li><Link href="#" className="hover:text-ink-900">Categories</Link></li>
              <li><Link href="/compare" className="hover:text-ink-900">Comparisons</Link></li>
              <li><Link href="/blog" className="hover:text-ink-900">Buying guides</Link></li>
              <li><Link href="/pricing" className="hover:text-ink-900">Pricing</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company" className="text-sm">
            <p className="mb-2 font-medium text-ink-900">Company</p>
            <ul className="space-y-1.5 text-ink-500">
              <li><Link href="#" className="hover:text-ink-900">About</Link></li>
              <li><Link href="#" className="hover:text-ink-900">Affiliate disclosure</Link></li>
              <li><Link href="#" className="hover:text-ink-900">Privacy</Link></li>
            </ul>
          </nav>
        </div>

        <p className="mt-8 border-t border-ink-100 pt-6 text-xs text-ink-300">
          As an affiliate, NeedInFind may earn a commission from qualifying purchases made
          through links to retailer partners. This does not affect the price you pay.
          NeedInFind is not owned by or affiliated with Amazon or any retailer it links to.
        </p>
      </div>
    </footer>
  );
}
