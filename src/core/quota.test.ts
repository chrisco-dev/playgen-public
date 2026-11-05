import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUOTA_BUDGET,
  discoveryBudget,
  grantUnits,
  remainingUnits,
} from "./quota";

describe("quota budget math", () => {
  it("reserves a fraction for interactive use", () => {
    expect(DEFAULT_QUOTA_BUDGET.reserveFraction).toBe(0.3);
    expect(discoveryBudget(DEFAULT_QUOTA_BUDGET)).toBe(7000);
  });

  it("computes discovery budget from a custom budget", () => {
    expect(discoveryBudget({ dailyUnits: 1000, reserveFraction: 0.5 })).toBe(
      500,
    );
  });

  it("computes remaining units clamped at zero", () => {
    const budget = { dailyUnits: 1000, reserveFraction: 0.5 };
    expect(remainingUnits(budget, 0)).toBe(500);
    expect(remainingUnits(budget, 400)).toBe(100);
    expect(remainingUnits(budget, 600)).toBe(0);
  });

  it("grants up to the remaining budget", () => {
    const budget = { dailyUnits: 1000, reserveFraction: 0.5 };
    expect(grantUnits(budget, 0, 100)).toBe(100);
    expect(grantUnits(budget, 450, 100)).toBe(50);
    expect(grantUnits(budget, 500, 100)).toBe(0);
  });
});
