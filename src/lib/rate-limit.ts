import "server-only";

/**
 * Basic anti-abuse guard, used for two distinct purposes with different
 * thresholds:
 * - The assistant endpoint (generous — stops scripted bursts, not normal use)
 * - Auth flows: login/register (strict — brute-force/credential-stuffing
 *   and mass-signup protection, per spec §14's rate limiting requirement
 *   applied to the auth surface as well as AI)
 *
 * Deliberately simple and in-memory. This only works per server instance —
 * on a multi-instance deployment, swap this for a shared store
 * (Redis/Upstash) without changing any call site below.
 */

const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  { windowMs = 60_000, max = 12 }: { windowMs?: number; max?: number } = {}
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

// Strict preset for auth flows — 5 attempts per 15 minutes per identity
// (email, or IP as a fallback when there's no email yet to key on).
export function isAuthRateLimited(key: string): boolean {
  return isRateLimited(`auth:${key}`, { windowMs: 15 * 60_000, max: 5 });
}
