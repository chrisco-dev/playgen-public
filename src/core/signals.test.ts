import { describe, expect, it } from "vitest";
import type { Signal } from "./signal";
import { defaultPolarity, effectiveWeight, flipSignal } from "./signals";

function makeSignal(
  id: string,
  polarity: 1 | -1,
  delta: number,
  supersedesId: string | null = null,
): Signal {
  return {
    id,
    videoId: "v1",
    kind: "click",
    polarity,
    delta,
    createdAt: "x",
    supersedesId,
  };
}

describe("signals", () => {
  it("derives polarity from kind", () => {
    expect(defaultPolarity("like")).toBe(1);
    expect(defaultPolarity("dislike")).toBe(-1);
    expect(defaultPolarity("skip")).toBe(-1);
    expect(defaultPolarity("click")).toBe(1);
  });

  it("flips polarity and supersedes the original", () => {
    const original = makeSignal("s1", 1, 1);

    const flipped = flipSignal(original, new Date("2026-11-05T00:00:00.000Z"));

    expect(flipped.polarity).toBe(-1);
    expect(flipped.supersedesId).toBe("s1");
  });

  it("computes effective weight from live signals", () => {
    const live = [makeSignal("s1", 1, 1), makeSignal("s2", -1, 0.5)];

    expect(effectiveWeight(3, live)).toBe(3.5);
  });

  it("flipping a signal reverses its effect on weight", () => {
    expect(effectiveWeight(0, [makeSignal("s1", 1, 1)])).toBe(1);
    expect(effectiveWeight(0, [makeSignal("s2", -1, 1)])).toBe(-1);
  });
});
