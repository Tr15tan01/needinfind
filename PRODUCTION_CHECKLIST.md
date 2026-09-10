# Production checklist

Concrete, specific items — not "test everything" boilerplate. Check each
before pointing a real domain at this.

## Environment

- [ ] `DATABASE_URL` and `DIRECT_URL` point at production Supabase (or
      other Postgres), not a dev database.
- [ ] `AUTH_SECRET` is a real generated value (`npx auth secret`), not the
      dev placeholder — and is **different** from any secret used in staging.
- [ ] `NEXT_PUBLIC_SITE_URL` is the real production domain. This feeds
      canonical URLs, the sitemap, Open Graph tags, and Stripe's
      success/cancel redirect URLs — wrong here means all of those are wrong.
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set, with the OAuth
      redirect URI in Google Cloud Console updated to
      `https://<production-domain>/api/auth/callback/google` (the
      `localhost` one from local dev won't work in production).
- [ ] `GEMINI_API_KEY` set, and `GEMINI_MODEL` reviewed if you want a
      specific model rather than the default.
- [ ] `STRIPE_SECRET_KEY` is a **live** key, not a test key.
- [ ] `STRIPE_WEBHOOK_SECRET` matches a webhook endpoint actually
      registered in the Stripe dashboard pointing at
      `https://<production-domain>/api/webhooks/stripe`, with at least
      `checkout.session.completed`, `customer.subscription.updated`, and
      `customer.subscription.deleted` selected.

## Database

- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) against
      production — `migrate dev` can prompt interactively and isn't meant
      for non-interactive/production use.
- [ ] Run the seed script **once** against production if you want the
      starter categories/plans, then immediately change the seeded admin
      password (`SEED_ADMIN_PASSWORD` default is not safe to leave as-is).
- [ ] Confirm your Postgres provider's backup policy is what you expect —
      this app doesn't implement its own backup mechanism.

## Content & configuration

- [ ] Replace or remove the dev-only seed products/categories/blog post
      with real content before launch, unless you genuinely want them live.
- [ ] Narrow `next.config.mjs`'s image `remotePatterns` from the wildcard
      `hostname: "**"` to the actual retailer/CDN domains you use, now that
      you know what they are (flagged as an accepted MVP shortcut in the
      Phase 11 notes — this is where you close it).
- [ ] Verify `/sitemap.xml` and `/robots.txt` render correctly against
      production data.
- [ ] Hit `/api/health` and confirm it returns `{"status":"ok"}`.

## Testing

- [ ] `npm run test` passes (22 unit tests as of Phase 12 — pure logic:
      slugify, rate limiting, the assistant's structured-output validation,
      and product-matching scoring).
- [ ] Manually walk the core flow at least once against production: ask
      the assistant a question → get a recommendation → click through an
      affiliate link → confirm the click is recorded in Admin → Dashboard.
- [ ] Manually test checkout end-to-end with a real (or Stripe test-mode)
      card before flipping `STRIPE_SECRET_KEY` to a live key.

## Known limitations to revisit (stated here, not hidden)

- No Content-Security-Policy header (Phase 11) — needs per-request nonces
  threaded through JSON-LD and Next's hydration scripts; real follow-up
  work, not done here.
- Rate limiting (`src/lib/rate-limit.ts`) is in-memory, per server
  instance. Fine for a single-instance deployment; needs a shared store
  (Redis/Upstash) if you scale to multiple instances, or limits become
  easy to bypass by hitting a different instance.
- Guest AI usage limits are cookie-based and can be reset by clearing
  cookies — accepted per spec's "prevent bypasses where practical" wording,
  not a full solution.
- Subscription cancellation is immediate, not cancel-at-period-end.
- No error-monitoring/alerting service (Sentry or similar) is wired up —
  errors currently only go to `console.error`, which most hosting
  platforms capture in logs but don't alert on.

