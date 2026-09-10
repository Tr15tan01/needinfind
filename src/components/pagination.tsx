import Link from "next/link";

export function Pagination({
  page,
  pageCount,
  basePath
}: {
  page: number;
  pageCount: number;
  basePath: string;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1}>
        ← Previous
      </PageLink>
      <span className="text-sm text-ink-300">
        Page {page} of {pageCount}
      </span>
      <PageLink href={hrefFor(page + 1)} disabled={page >= pageCount}>
        Next →
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-full border border-ink-100 px-3.5 py-1.5 text-sm text-ink-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-ink-100 px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-trust-500 hover:text-trust-700"
    >
      {children}
    </Link>
  );
}
