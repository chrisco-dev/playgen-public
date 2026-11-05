import { describe, expect, it } from "vitest";
import { FixedClock, makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("GET /health", () => {
  it("returns ok with the current time from the clock", async () => {
    const fixed = new Date("2026-11-05T09:00:00.000Z");
    const app = await buildServer(makeInMemoryDeps(new FixedClock(fixed)));

    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok", time: fixed.toISOString() });
  });
});
