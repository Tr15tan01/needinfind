import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * Blog posts are authored as Markdown in the admin CMS. The rendered HTML
 * only ever originates from admins (spec §16: admin-only CMS), not
 * arbitrary users, so this isn't a user-generated-content problem the way
 * a public comment box would be. Sanitizing anyway, as defense-in-depth:
 * a compromised admin account, a supply-chain issue in `marked` itself, or
 * simply a typo'd `<script>` pasted into a draft shouldn't be able to run
 * arbitrary JS for every visitor. If public submissions are ever added,
 * this remains necessary, not optional.
 */
export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false }) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel"]
    },
    // Markdown links/images never need these schemes — closes off
    // javascript: URLs in a pasted link even though marked doesn't
    // generate them itself.
    allowedSchemes: ["http", "https", "mailto"]
  });
}
