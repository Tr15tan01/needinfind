import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Scoped to the (site) route group specifically so /admin/* never renders
// this — admin has its own layout.tsx with its own sidebar nav, and
// previously (a real bug, fixed here) was getting this marketing
// header/footer stacked around it too, since Next.js composes nested
// layouts rather than letting a nested route opt out of an ancestor's.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
