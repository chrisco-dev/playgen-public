import { RateLimitExceededError } from "./quota";

export interface BackoffPolicy {
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
}

export const DEFAULT_BACKOFF: BackoffPolicy = {
  initialDelayMs: 1_000,
  maxDelayMs: 60_000,
  factor: 2,
};

// Delay before retry attempt `attempt` (0-indexed): initial, then *factor each time.
export function nextDelay(policy: BackoffPolicy, attempt: number): number {
  return Math.min(
    policy.maxDelayMs,
    policy.initialDelayMs * policy.factor ** attempt,
  );
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof RateLimitExceededError;
}
