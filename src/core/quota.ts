export const DAILY_QUOTA_UNITS = 10_000;
export const RESERVE_FRACTION = 0.3;

export type Bucket = "interactive" | "discovery";

export interface QuotaBudget {
  dailyUnits: number;
  reserveFraction: number;
}

export const DEFAULT_QUOTA_BUDGET: QuotaBudget = {
  dailyUnits: DAILY_QUOTA_UNITS,
  reserveFraction: RESERVE_FRACTION,
};

export class RateLimitExceededError extends Error {
  constructor(message = "rate limit exceeded") {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

// Units available to background (non-interactive) work in a day.
export function discoveryBudget(budget: QuotaBudget): number {
  return Math.floor(budget.dailyUnits * (1 - budget.reserveFraction));
}

// Units still spendable given how many have already been used today.
export function remainingUnits(budget: QuotaBudget, used: number): number {
  return Math.max(0, discoveryBudget(budget) - used);
}

// The amount of a request the budget can actually cover.
export function grantUnits(
  budget: QuotaBudget,
  used: number,
  requested: number,
): number {
  return Math.min(requested, remainingUnits(budget, used));
}
