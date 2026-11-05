import { describe, expect, it } from "vitest";
import { FixtureSearchProvider } from "./fixture-search-provider";

describe("FixtureSearchProvider", () => {
  it("returns deterministic results for the same query", async () => {
    const provider = new FixtureSearchProvider();
    const first = await provider.search("rust");
    const second = await provider.search("rust");

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first[0]?.provider).toBe("fixture");
  });
});
