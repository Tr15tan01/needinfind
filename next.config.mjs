/** @type {import('next').NextConfig} */
// Next.js 16: `next dev` and `next build` use Turbopack by default.
const nextConfig = {
  // Produces a minimal, self-contained server bundle in .next/standalone —
  // what the Dockerfile copies into the final image, instead of shipping
  // the full node_modules tree.
  // output: "standalone",
  images: {
    // Product images will initially come from CMS-entered URLs (retailer CDNs, uploads).
    // Add specific remotePatterns here as retailers/CDNs are configured.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Baseline security headers (Phase 11 hardening pass). Deliberately not
  // including a Content-Security-Policy here: a *correct* CSP needs
  // per-request nonces threaded through the JSON-LD <script> tags and
  // Next's own inline hydration scripts, which is a meaningful chunk of
  // work on its own — better to ship no CSP than a wrong one that either
  // blocks the site or provides false confidence. That remains open work.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Admin panel especially should never be frameable — clickjacking
          // protection for the whole site costs nothing since nothing here
          // needs to be embedded in an iframe.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
