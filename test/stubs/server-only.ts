// Vitest-only stub. The real "server-only" package intentionally throws
// when resolved outside Next.js's own bundler (that's how it enforces the
// server/client boundary during a real Next build) — but a plain Node test
// runner like Vitest has no client/server bundle distinction at all, so
// the throw is meaningless noise there, not a real violation. This empty
// module is aliased in vitest.config.ts so tests can still import
// server-only modules for their non-Next-specific logic.
export {};
