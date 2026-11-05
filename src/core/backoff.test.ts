import { describe, expect, it } from "vitest";
import { DEFAULT_BACKOFF, isRateLimitError, nextDelay } from "./backoff";
import { RateLimitExceededError } from "./quota";

describe("backoff", () => {
  it("grows delay exponentially and caps at max", () => {
    const policy = { initialDelayMs: 1000, maxDelayMs: 5000, factor: 2 };
    expect(nextDelay(policy, 0)).toBe(1000);
    expect(nextDelay(policy, 1)).toBe(2000);
    expect(nextDelay(policy, 2)).toBe(4000);
    expect(nextDelay(policy, 3)).toBe(5000);
  });

  it("recognises rate-limit errors only", () => {
    expect(isRateLimitError(new RateLimitExceededError())).toBe(true);
    expect(isRateLimitError(new Error("boom"))).toBe(false);
    expect(isRateLimitError("nope")).toBe(false);
  });

  it("has a sane default", () => {
    expect(DEFAULT_BACKOFF.initialDelayMs).toBeGreaterThan(0);
    expect(DEFAULT_BACKOFF.factor).toBeGreaterThan(1);
  });
});
