import { describe, expect, it } from "vitest";
import type { Interest } from "./interest";
import {
  effectiveWeightForInterest,
  interestMatchesVideo,
  rankVideos,
} from "./ranking";
import type { Signal } from "./signal";
import type { Video } from "./video";

const interest: Interest = {
  id: "i1",
  userId: "u",
  label: "rust",
  weight: 5,
  confidence: 1,
  source: "manual",
  createdAt: "x",
  updatedAt: "x",
};

const video: Video = {
  id: "v1",
  provider: "fixture",
  externalId: "rust-1",
  title: "Rust for beginners",
  channelId: "c1",
  channelTitle: "ch",
  durationSeconds: 60,
  publishedAt: "2026-01-01T00:00:00.000Z",
  tags: ["rust"],
  firstSeenAt: "x",
};

function signal(id: string, videoId: string, polarity: 1 | -1): Signal {
  return {
    id,
    videoId,
    kind: "like",
    polarity,
    delta: 1,
    createdAt: "x",
    supersedesId: null,
  };
}

const now = new Date("2026-06-01T00:00:00.000Z");

describe("explainability", () => {
  it("matches an interest against a video", () => {
    expect(interestMatchesVideo(interest, video)).toBe(true);
    expect(interestMatchesVideo({ ...interest, label: "go" }, video)).toBe(
      false,
    );
  });

  it("computes effective weight from live signals on matching videos", () => {
    expect(effectiveWeightForInterest(interest, [video], [])).toBe(5);
    expect(
      effectiveWeightForInterest(interest, [video], [signal("s1", "v1", 1)]),
    ).toBe(6);
    expect(
      effectiveWeightForInterest(interest, [video], [signal("s1", "v1", -1)]),
    ).toBe(4);
  });

  it("ignores signals on non-matching videos", () => {
    const other: Video = {
      ...video,
      id: "v2",
      title: "Unrelated",
      tags: ["other"],
    };
    expect(
      effectiveWeightForInterest(
        interest,
        [video, other],
        [signal("s1", "v2", 1)],
      ),
    ).toBe(5);
  });

  it("flipping a signal changes the ranking", () => {
    const baseline = rankVideos([video], [interest], now)[0]?.score ?? 0;
    const afterLike =
      rankVideos([video], [interest], now, [signal("s1", "v1", 1)])[0]?.score ??
      0;
    const afterDislike =
      rankVideos([video], [interest], now, [signal("s2", "v1", -1)])[0]
        ?.score ?? 0;

    expect(afterLike).toBeGreaterThan(baseline);
    expect(afterDislike).toBeLessThan(baseline);
  });
});
