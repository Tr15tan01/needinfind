import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the max within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, { windowMs: 60_000, max: 5 })).toBe(false);
    }
  });

  it("blocks once the max is exceeded within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      isRateLimited(key, { windowMs: 60_000, max: 5 });
    }
    expect(isRateLimited(key, { windowMs: 60_000, max: 5 })).toBe(true);
  });

  it("resets once the window has fully elapsed", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      isRateLimited(key, { windowMs: 60_000, max: 5 });
    }
    expect(isRateLimited(key, { windowMs: 60_000, max: 5 })).toBe(true);

    vi.advanceTimersByTime(61_000);

    expect(isRateLimited(key, { windowMs: 60_000, max: 5 })).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) isRateLimited(keyA, { windowMs: 60_000, max: 5 });

    expect(isRateLimited(keyA, { windowMs: 60_000, max: 5 })).toBe(true);
    expect(isRateLimited(keyB, { windowMs: 60_000, max: 5 })).toBe(false);
  });
});
