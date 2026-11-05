import { beforeEach, describe, expect, it } from "vitest";
import type { QuotaBudget } from "../core/index";
import { FixedClock } from "../test-utils";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzleQuotaLedger } from "./drizzle-quota-ledger";

describe("DrizzleQuotaLedger", () => {
  let db: Db;
  const budget: QuotaBudget = { dailyUnits: 1000, reserveFraction: 0.5 };

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
  });

  it("reserves within budget and records entries", async () => {
    const ledger = new DrizzleQuotaLedger(db, new FixedClock(), budget);

    const reservation = await ledger.reserve(100, "search:a");

    expect(reservation).toEqual({
      requested: 100,
      granted: 100,
      denied: false,
    });
    expect(await ledger.usedToday()).toBe(100);
    expect(await ledger.listEntries()).toHaveLength(1);
  });

  it("denies when the budget is exhausted", async () => {
    const ledger = new DrizzleQuotaLedger(db, new FixedClock(), budget);
    await ledger.reserve(500, "a");

    const reservation = await ledger.reserve(100, "b");

    expect(reservation).toEqual({ requested: 100, granted: 0, denied: true });
    expect(await ledger.usedToday()).toBe(500);
  });

  it("does not count other days' spend", async () => {
    const ledger = new DrizzleQuotaLedger(db, new FixedClock(), budget);
    await ledger.reserve(100, "a");

    const nextDay = new DrizzleQuotaLedger(
      db,
      new FixedClock(new Date("2026-11-06T00:00:00.000Z")),
      budget,
    );

    expect(await nextDay.usedToday()).toBe(0);
  });
});
