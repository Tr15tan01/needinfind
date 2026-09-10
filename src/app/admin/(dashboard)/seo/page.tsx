export default function AdminSeoPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900">SEO</h1>
      <div className="mt-4 max-w-lg space-y-3 text-sm text-ink-500">
        <p>
          <code>/sitemap.xml</code> and <code>/robots.txt</code> are live and
          generated automatically from published products, categories,
          comparisons, and blog posts — nothing to configure here.
        </p>
        <p>
          Structured data (schema.org <code>Product</code>, <code>Article</code>,{" "}
          <code>BreadcrumbList</code>) and canonical URLs are generated per-page.
          Per-page SEO title/description fields live on each product, category,
          comparison, and blog post's own edit screen.
        </p>
        <p className="text-ink-300">
          A dedicated redirects/settings UI can be added here later if needed —
          nothing in the current setup requires one.
        </p>
      </div>
    </div>
  );
}
