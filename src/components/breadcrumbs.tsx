import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-300">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink-500">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-500">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
