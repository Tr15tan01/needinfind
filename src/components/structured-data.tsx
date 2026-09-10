// Injects schema.org structured data. The JSON itself is always built
// server-side from our own data rather than raw user input interpolated
// as a string — but the *values inside* it (a product name, a blog title)
// are still admin/catalog-entered text, not something we control the
// content of. JSON.stringify does NOT escape "<", so a value containing
// "</script>" would otherwise break out of this tag and let arbitrary
// HTML execute — escaping "<" to "\u003c" closes that off completely
// (it's valid inside a JSON string and parses back to a plain "<").
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
