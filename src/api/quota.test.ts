import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("quota route", () => {
  let deps: ReturnType<typeof makeInMemoryDeps>;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    deps = makeInMemoryDeps();
    app = await buildServer(deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it("reports an empty quota status", async () => {
    const res = await app.inject({ method: "GET", url: "/quota" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      dailyUnits: 10000,
      reserveFraction: 0.3,
      discoveryBudget: 7000,
      used: 0,
      remaining: 7000,
    });
    expect(res.json().entries).toEqual([]);
  });

  it("reports spend after a reservation", async () => {
    await deps.quotaLedger.reserve(100, "search:x");

    const res = await app.inject({ method: "GET", url: "/quota" });
    const body = res.json();

    expect(body.used).toBe(100);
    expect(body.remaining).toBe(6900);
    expect(body.entries).toHaveLength(1);
  });
});
