import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE, isDue, periodStart } from "./schedule";

describe("schedule", () => {
  it("computes the daily period start", () => {
    const now = new Date("2026-11-05T10:00:00.000Z");
    expect(periodStart("daily", now).toISOString()).toBe(
      "2026-11-05T00:00:00.000Z",
    );
  });

  it("computes the weekly period start (Sunday)", () => {
    // 2026-11-05 is a Thursday; its week starts Sunday 2026-11-01
    const now = new Date("2026-11-05T10:00:00.000Z");
    expect(periodStart("weekly", now).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });

  it("is due daily after the scheduled hour", () => {
    const before = new Date("2026-11-05T10:00:00.000Z");
    const after = new Date("2026-11-05T19:00:00.000Z");
    expect(isDue("daily", before, null, DEFAULT_SCHEDULE)).toBe(false);
    expect(isDue("daily", after, null, DEFAULT_SCHEDULE)).toBe(true);
  });

  it("is not due daily again after completing today", () => {
    const now = new Date("2026-11-05T19:00:00.000Z");
    const last = new Date("2026-11-05T12:00:00.000Z");
    expect(isDue("daily", now, last, DEFAULT_SCHEDULE)).toBe(false);
  });

  it("is due daily again the next day after the hour", () => {
    const now = new Date("2026-11-06T19:00:00.000Z");
    const last = new Date("2026-11-05T20:00:00.000Z");
    expect(isDue("daily", now, last, DEFAULT_SCHEDULE)).toBe(true);
  });

  it("is due weekly on the scheduled weekday after the hour", () => {
    const satAfter = new Date("2026-11-07T10:00:00.000Z");
    const satBefore = new Date("2026-11-07T08:00:00.000Z");
    const friday = new Date("2026-11-06T10:00:00.000Z");
    expect(isDue("weekly", satAfter, null, DEFAULT_SCHEDULE)).toBe(true);
    expect(isDue("weekly", satBefore, null, DEFAULT_SCHEDULE)).toBe(false);
    expect(isDue("weekly", friday, null, DEFAULT_SCHEDULE)).toBe(false);
  });

  it("is not due weekly again after completing this week", () => {
    const now = new Date("2026-11-07T10:00:00.000Z");
    const last = new Date("2026-11-07T09:30:00.000Z");
    expect(isDue("weekly", now, last, DEFAULT_SCHEDULE)).toBe(false);
  });
});
