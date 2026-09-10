/**
 * Shared across every admin CRUD action that derives a URL slug from a
 * name/title. Previously copy-pasted verbatim into 6 different actions.ts
 * files — consolidated here so it's defined once and actually unit-tested
 * (see slugify.test.ts) instead of trusted-by-duplication.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
