# NeedInFind

"Tell us what you need." — an AI-powered shopping adviser and affiliate
product-discovery platform. Users describe a problem in plain language; an
AI assistant asks clarifying questions, searches NeedInFind's own product
catalog, and recommends real products with links to retailer partners
(Amazon, Best Buy, etc.). NeedInFind never processes purchases itself and
never invents products, prices, or affiliate links.

## Status: Phase 12 of 12 — Testing & production readiness

**All 12 phases are now complete.** Phases 1–11 are unchanged; this phase
adds real automated tests, error/loading handling that was missing
everywhere, and the deployment scaffolding needed to actually ship this.

**Testing — genuinely run and passing in this environment, not just
written:**
- `npm run test` runs **22 unit tests across 4 files**, covering pure logic
  that doesn't need a database: `slugify` (consolidated from **6 copy-pasted
  implementations** across admin action files into one shared, tested
  utility at `src/lib/slugify.ts`), the rate limiter's window/threshold
  behavior, the zod schema that validates Gemini's structured output
  (including that malformed model output is correctly rejected — the exact
  case spec §10/§11 cares about), and the deterministic product-matching
  scorer (extracted into a zero-dependency module,
  `src/lib/services/product-scoring.ts`, specifically so it's testable
  without Prisma at all).
- Along the way, found that **`server-only` was used throughout the
  codebase but never actually declared as a dependency** — it silently
  worked only because Next's bundler has an internal alias for it; any
  other tool (Vitest included) breaks without it explicitly installed.
  Fixed by adding it to `package.json` for real.

**Error handling & loading states — previously missing everywhere:**
- `error.tsx` (public site) and a separate `admin/(dashboard)/error.tsx`
  (different recovery path — back to the dashboard, not the public
  homepage), plus `global-error.tsx` for the rare case the root layout
  itself throws.
- Custom `not-found.tsx` matching the design system, replacing Next's
  default blank 404.
- `loading.tsx` skeletons — a global fallback plus route-shaped ones for
  the product and category pages specifically, since generic spinners
  undersell how fast ISR (Phase 11) actually makes those pages.

**Deployment:**
- **`/api/health`** — minimal liveness/readiness endpoint (checks the app
  is up and the database is reachable), for uptime monitors or a container
  orchestrator's health probe.
- **`Dockerfile`** (multi-stage, using `output: "standalone"`) +
  `.dockerignore` for self-hosting outside Vercel.
- **`PRODUCTION_CHECKLIST.md`** — a specific, concrete pre-launch list
  (exact env vars, exact migration command, exact things to verify), not
  generic "test everything" advice — including every known limitation
  from Phases 6/10/11 gathered in one place rather than scattered across
  phase notes.

**What's not here, stated plainly:** integration/E2E tests against a live
browser+database (Playwright et al.) aren't included — this sandbox has no
live Postgres/Stripe/Gemini to run them against meaningfully, and a test
suite that's never actually been executed isn't worth more than the
`PRODUCTION_CHECKLIST.md`'s manual walkthrough item it maps to. The unit
tests above **were** actually run here and are real.

## Post-Phase-12 fixes

Requested after the 12 phases were done: a crash fix and dark mode. Both
surfaced real, structural issues worth documenting plainly rather than
patching over.

**Crash fix — `JWTSessionError: no matching decryption secret`:**
- Root cause: a browser session cookie encrypted with an older
  `AUTH_SECRET` than the one currently configured (expected after
  rotating the secret — not a bug on its own).
- Real bug this exposed: `auth()` can **throw** instead of resolving to
  `null`, and `SiteHeader` (rendered on every page via the layout) called
  it with no error handling — one bad cookie crashed the *entire site*,
  which is why products appeared to vanish from every page. Fixed with
  `src/lib/safe-auth.ts`'s `getSafeSession()`, applied everywhere `auth()`
  was called directly (12 files).
- **Second-order bug caught by the build itself**: a naive `try/catch`
  around `auth()` also swallows Next.js's internal `DYNAMIC_SERVER_USAGE`
  signal — the same mechanism `redirect()`/`notFound()` use — which broke
  Next's automatic dynamic-rendering detection and crashed the build.
  Fixed by re-throwing anything with a `NEXT_*`/`DYNAMIC_SERVER_USAGE`
  digest and only swallowing genuine auth failures.
- **Separately found while fixing this**: the admin panel has rendered
  with the public marketing header **and footer wrapped around its own
  sidebar** since Phase 2 — Next.js composes nested layouts rather than
  letting a nested route opt out of an ancestor's. Fixed by moving every
  public route into a `(site)` route group with its own
  header/footer-owning layout, so `/admin/*` no longer inherits it. URLs
  are unchanged (route groups don't appear in the path).
- **Honest correction to Phase 11**: that phase claimed ISR (`revalidate`)
  was in effect on the homepage, category, blog-index, and comparisons-
  index pages because they don't call `auth()` themselves. That reasoning
  missed that the *shared header* they all render calls `auth()` — which
  forces the whole route dynamic regardless of the page's own `revalidate`
  export, a real Next.js behavior (any dynamic API used anywhere in a
  route's render tree opts the whole route out of static caching). The
  build output now shows every one of those routes as `ƒ` (dynamic), not
  cached. This was very likely already true before this fix too — the
  `revalidate` exports were probably never actually taking effect since
  Phase 11 shipped. Not fixed here (would mean decoupling the header's
  sign-in state into a small client-side fetch so the server render itself
  stays cookie-free); flagged honestly rather than left as an uncorrected
  claim.

**Dark mode:**
- Every design-system color (`ink`, `parchment`, `trust`, `gold`, plus a
  new `surface` token replacing the ~52 places `bg-white` was used as a
  card background) is now a CSS variable with light values under `:root`
  and dark values under `.dark` (`src/app/globals.css`,
  `tailwind.config.ts`). Toggling one class on `<html>` re-themes the
  entire app — including all 12 phases of admin pages — without adding a
  `dark:` variant to hundreds of existing `className` strings individually.
- A toggle button (`src/components/theme-toggle.tsx`) sits in both the
  public header and the admin sidebar; preference persists to
  `localStorage` and falls back to OS preference. A blocking inline script
  in `<head>` (`src/lib/theme-script.ts`) sets the class before first
  paint to avoid a flash of the wrong theme.

## Admin login

```bash
npm run prisma:seed
```

seeds an admin user. Defaults to `admin@needinfind.dev` / `changeme123` —
override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before
seeding, and change the password before this goes anywhere near production.
Sign in at `/admin/login`.

## Using Supabase

This app runs on plain PostgreSQL via Prisma, and Supabase is Postgres —
so no rewrite is needed, just two things Supabase requires:

1. **Two connection strings, not one.** Supabase database, so both are used:
   - `DATABASE_URL` — the pooled **Transaction** connection (port `6543`,
     via PgBouncer), with `?pgbouncer=true` appended. This is what the app
     uses for normal queries, and it's what you deploy with on serverless
     platforms (Vercel, etc.) since each function invocation can't hold its
     own long-lived direct connection.
   - `DIRECT_URL` — the **direct** connection (port `5432`, no PgBouncer).
     `prisma migrate` / `prisma db push` need this; PgBouncer's transaction
     mode doesn't support the session-level features migrations use.

   Both are in your Supabase project: **Project Settings → Database →
   Connection string**. `schema.prisma`'s `datasource` block already
   declares both (`url` / `directUrl`) — just fill in `.env`.

2. **Auth stays as Auth.js**, not Supabase Auth. The schema's `User` /
   `Account` / `Session` tables follow the Auth.js/Prisma-adapter shape
   from spec §15, and that's unaffected by which Postgres host they live
   on. If you'd rather use Supabase Auth instead of Auth.js later, that's
   a Phase 4 decision, not a Phase 1 one — say so before that phase and
   I'll swap the auth layer instead of layering both.

Everything else — `npm run prisma:migrate`, `npm run prisma:seed`,
`npm run dev` — works exactly as described above once `DATABASE_URL` and
`DIRECT_URL` point at your Supabase project.

`@supabase/supabase-js` is included as a dependency for later use (e.g.
Supabase Storage for product images) — it's not required for the database
layer itself, which goes through Prisma.

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum
npm run prisma:migrate    # creates tables from prisma/schema.prisma
npm run prisma:seed       # optional: adds a couple of dev-only sample rows
npm run dev
```

Requires a PostgreSQL database reachable at `DATABASE_URL`. Node 18.18+.

Run `npm run test` to run the unit test suite (pure logic — slugify, rate
limiting, assistant output validation, product-matching scoring; no
database required).

## Deployment

**Vercel** (simplest): connect the repo, set the env vars from
`.env.example` in the project settings, and deploy — `output: "standalone"`
in `next.config.mjs` doesn't get in the way of this, Vercel ignores it.

**Self-hosted / Docker**:
```bash
docker build -t needinfind .
docker run -p 3000:3000 --env-file .env needinfind
```
Point your container orchestrator's health check at `GET /api/health`.

Either way, see **`PRODUCTION_CHECKLIST.md`** before pointing a real domain
at it — it lists exact environment variables, the correct non-interactive
migration command for production (`prisma migrate deploy`, not `migrate
dev`), and every known limitation from earlier phases gathered in one place.

## Project structure

```
prisma/
  schema.prisma        # full data model (see below)
  seed.ts              # dev-only sample data — admin user, retailers,
                        # categories, 3 featured products — not production content
middleware.ts           # /admin/* auth gate + site-wide guest-cookie assignment
Dockerfile               # multi-stage build, uses output: "standalone"
vitest.config.mts         # unit test config
PRODUCTION_CHECKLIST.md    # concrete pre-launch checklist
src/
  auth.ts               # Auth.js v5 config: Google (customer) + Credentials (admin)
  app/
    layout.tsx           # TRUE root: html/body, fonts, theme-init script only
    globals.css            # theme CSS variables (light + .dark) live here
    loading.tsx            # global loading skeleton
    error.tsx               # public-site error boundary
    global-error.tsx         # root-layout-level catastrophic error boundary
    not-found.tsx             # custom 404
    (site)/                 # route group: every public page, wrapped in header/footer
      layout.tsx               # header + footer — NOT inherited by /admin
      page.tsx                  # homepage (hero + live featured products/categories)
      login/                 # customer sign-in (Google + email/password)
      register/               # customer account creation
      account/               # minimal protected user page
      assistant/              # AI chat page
      blog/                   # blog index
        [slug]/                 # individual post (Markdown rendered, Article schema)
      compare/                # comparisons index
        [slug]/                 # individual comparison page
      pricing/                # plan list + Stripe Checkout server action
      [categorySlug]/        # top-level category page
        [subcategorySlug]/     # subcategory page
      products/[slug]/      # product detail (breadcrumbs, related products)
    go/[offerId]/            # outbound affiliate redirect — records click, then 302s
    sitemap.ts               # dynamic XML sitemap
    robots.ts                 # robots.txt, points at the sitemap
    api/
      auth/[...nextauth]/route.ts
      assistant/message/route.ts   # POST — one assistant turn
      webhooks/stripe/route.ts      # Stripe webhook — only writer of Subscription
      health/route.ts                # liveness/readiness check
    admin/
      login/               # unprotected — outside the (dashboard) route group
      (dashboard)/         # everything below requires role: ADMIN
        layout.tsx           # sidebar shell + auth guard (force-dynamic)
        page.tsx              # dashboard overview
        products/             # list, new, edit (specs/features/images/offers)
        categories/
        retailers/
        homepage/             # hero copy editor
        comparisons/ blog/ users/ ai-usage/ subscriptions/
        pricing-plans/ seo/ settings/   # stub pages, phase-labeled
  components/
    layout/               # site-header (live categories + session state), site-footer
    product-card.tsx
    breadcrumbs.tsx
    pagination.tsx
    assistant-chat.tsx      # client chat UI
    theme-toggle.tsx          # dark/light toggle, in header + admin sidebar
  lib/
    prisma.ts             # Prisma client singleton
    session.ts             # requireAdmin() — used in every admin Server Action
    safe-auth.ts             # getSafeSession() — auth() that can't crash a page
    theme-script.ts           # blocking dark-mode init script + storage key
    slugify.ts               # shared slug utility (unit tested)
    guest-cookie.ts         # shared cookie-name constant (edge-safe)
    guest-session.ts        # getGuestToken() — Server Component read helper
    rate-limit.ts            # rate limiter (unit tested) — assistant bursts + auth brute-force
    stripe.ts                 # Stripe SDK wrapper (only place the secret key is used)
    supabase.ts             # optional supabase-js clients (not used by Prisma)
    schemas/
      requirements.ts        # zod schema validating Gemini's structured output (unit tested)
    services/
      catalog.ts            # public-site reads; fails soft if DB is down
      comparisons.ts          # comparison reads; derives rows from real specs
      gemini.ts               # Gemini SDK wrapper (only place the API key is used)
      product-scoring.ts       # pure matching score, zero deps (unit tested)
      product-search.ts        # deterministic matching — the AI never queries directly
      assistant.ts             # orchestrates conversation + Gemini + matching
      usage.ts                  # server-enforced monthly message caps
      analytics.ts               # deferred AnalyticsEvent recording (after())
```

## Data model

The schema covers, per module:

- **Catalog** — `Category` (self-referencing for subcategories), `Product`,
  `ProductImage`, `ProductSpecification` (flexible EAV-style key/value pairs
  so a laptop's specs and a drill's specs don't need a shared rigid schema),
  `ProductFeature` (feature/pro/con).
- **Retailers** — `Retailer` and `Offer` are separate entities, so one
  `Product` can have many retailer `Offer`s (Amazon, Best Buy, ...) without
  the catalog being Amazon-specific.
- **AI** — `Conversation` and `Message`, supporting both guest sessions
  (`guestToken`) and signed-in users.
- **Comparisons** — `Comparison` + `ComparisonProduct` join table.
- **Editorial** — `BlogPost`, `BlogCategory`, `Tag`.
- **Billing** — `PricingPlan` (fully admin-configurable, nothing hardcoded),
  `Subscription`, `UsageRecord` (per-period message counters, enforced
  server-side).
- **CMS** — `HomepageSection` (typed, ordered, configurable sections) and a
  generic `SiteSetting` key/value table.
- **Tracking** — `AffiliateClick` and `AnalyticsEvent`.

## Design system

- Palette: ink navy (`#171B2E`) for authority, warm parchment (`#FBF9F4`)
  background, muted teal "trust" accent (`#2F6F5E`), gold (`#C99A4A`)
  reserved for the single primary call to action per screen.
- Type: Fraunces (display/serif) for headline moments, Inter for UI/body.
- The homepage's signature element is the hero composer — styled as a
  running dialogue rather than a generic search box, to reinforce "adviser,
  not aisle."

## Roadmap (from the master spec)

1. ✅ Project foundation
2. ✅ Admin/CMS (products, categories, retailers, offers, homepage config)
3. ✅ Public storefront (category & product listing pages)
4. ✅ Authentication (Auth.js, guest sessions)
5. ✅ AI assistant (Gemini, conversations, structured requirements, matching)
6. ✅ AI usage limits (guest/free/paid tiers, server-enforced)
7. ✅ Comparisons
8. ✅ Blog & SEO (sitemap, structured data, internal linking)
9. ✅ Affiliate click tracking
10. ✅ Payments/subscriptions
11. ✅ Security & performance hardening
12. ✅ Testing & production readiness

**All 12 phases complete.**

## Notes

- Product/spec/offer data is CMS-driven, not hardcoded in components —
  `prisma/seed.ts` exists only for local development.
- The AI layer (Phase 5) will sit behind a `ProductSearchService`
  abstraction rather than issuing raw SQL directly, so keyword search can
  later be extended with pgvector/embeddings without touching the AI code.
- Never commit `.env`. Copy `.env.example` and fill in real values locally
  or in your deployment platform's secret manager.
