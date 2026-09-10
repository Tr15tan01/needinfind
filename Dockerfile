# Multi-stage build — the final image only contains the standalone Next.js
# output (next.config.mjs's `output: "standalone"`), not the full
# node_modules tree or source, keeping the image small.

FROM node:20-alpine AS base

# --- Dependencies ------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Needed at build time for Next's static generation to succeed; real
# secrets (API keys, DATABASE_URL) are still only ever supplied at runtime
# via the container's environment, not baked into the image.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# --- Runtime ---------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# See /api/health — this is what a container orchestrator's healthcheck
# should point at.
CMD ["node", "server.js"]
