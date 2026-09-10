import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getSafeSession } from "@/lib/safe-auth";
import { ThemeToggle } from "@/components/theme-toggle";

// Explicit rather than relying on Next's implicit "this uses cookies(),
// mark it dynamic" detection propagating correctly from this layout down
// to every nested admin page during static generation — that detection
// proved fragile in practice (a build regression during Phase 12-plus
// hardening surfaced it). Every admin page reads live, permission-gated
// data anyway, so there was never a static-generation win to give up here.
export const dynamic = "force-dynamic";

const NAV_SECTIONS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/retailers", label: "Retailers & offers" }
    ]
  },
  {
    label: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage" },
      { href: "/admin/comparisons", label: "Comparisons" },
      { href: "/admin/blog", label: "Blog" }
    ]
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/ai-usage", label: "AI usage" },
      { href: "/admin/subscriptions", label: "Subscriptions" },
      { href: "/admin/pricing-plans", label: "Pricing plans" }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/admin/seo", label: "SEO" },
      { href: "/admin/settings", label: "Settings" }
    ]
  }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSafeSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Belt-and-suspenders: middleware.ts already redirects unauthenticated
  // requests before they get here, but the layout checks again so this
  // segment is never rendered for a non-admin session under any code path.
  if (role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-parchment-200">
      <aside className="w-60 shrink-0 border-r border-ink-100 bg-surface p-5">
        <div className="flex items-center justify-between px-1">
          <Link href="/admin" className="flex items-baseline gap-1">
            <span className="font-display text-lg italic text-ink-900">Need</span>
            <span className="font-display text-lg text-trust-700">InFind</span>
          </Link>
          <ThemeToggle />
        </div>
        <p className="mb-6 mt-0.5 px-1 text-xs uppercase tracking-wide text-ink-300">
          Admin
        </p>

        <nav className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2.5 py-1.5 text-sm text-ink-700 transition hover:bg-parchment-200 hover:text-ink-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-8 border-t border-ink-100 pt-4">
          <p className="px-1 text-xs text-ink-300">{session?.user?.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-2.5 py-1.5 text-left text-sm text-ink-500 transition hover:bg-parchment-200 hover:text-ink-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
