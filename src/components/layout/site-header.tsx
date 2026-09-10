import Link from "next/link";
import { signOut } from "@/auth";
import { getSafeSession } from "@/lib/safe-auth";
import { getTopLevelCategories } from "@/lib/services/catalog";
import { ThemeToggle } from "@/components/theme-toggle";

const FALLBACK_CATEGORIES = ["Computers", "Tools", "Kitchen", "Outdoor"];

export async function SiteHeader() {
  const [categories, session] = await Promise.all([getTopLevelCategories(), getSafeSession()]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-xl italic text-ink-900">Need</span>
          <span className="font-display text-xl text-trust-700">InFind</span>
        </Link>

        <nav aria-label="Categories" className="hidden items-center gap-6 md:flex">
          {categories.length > 0
            ? categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/${c.slug}`}
                  className="text-sm text-ink-500 transition hover:text-ink-900"
                >
                  {c.name}
                </Link>
              ))
            : FALLBACK_CATEGORIES.map((c) => (
                <span key={c} className="text-sm text-ink-300">
                  {c}
                </span>
              ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <>
              <Link
                href="/account"
                className="hidden text-sm text-ink-500 transition hover:text-ink-900 sm:inline"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="hidden text-sm text-ink-500 transition hover:text-ink-900 sm:inline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden text-sm text-ink-500 transition hover:text-ink-900 sm:inline"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/assistant"
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-parchment transition hover:bg-ink-700"
          >
            Ask AI
          </Link>
        </div>
      </div>
    </header>
  );
}
