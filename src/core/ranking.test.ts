import { describe, expect, it } from "vitest";
import type { Interest, Video } from "./index";
import {
  MODEL_VERSION,
  WeightedTagScoringModel,
  rankVideos,
  scoreVideo,
} from "./ranking";

function makeInterest(label: string, weight = 1): Interest {
  return {
    id: `i-${label}`,
    userId: "u",
    label,
    weight,
    confidence: 1,
    source: "manual",
    createdAt: "x",
    updatedAt: "x",
  };
}

function makeVideo(
  id: string,
  title: string,
  tags: string[],
  publishedAt: string,
): Video {
  return {
    id,
    provider: "p",
    externalId: id,
    title,
    channelId: "c",
    channelTitle: "C",
    durationSeconds: 1,
    publishedAt,
    tags,
    firstSeenAt: "x",
  };
}

describe("scoreVideo", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("is deterministic for a fixed now", () => {
    const video = makeVideo(
      "v1",
      "Rust for beginners",
      ["rust"],
      "2025-06-01T00:00:00.000Z",
    );
    const interests = [makeInterest("rust", 3)];

    const a = scoreVideo(video, interests, now);
    const b = scoreVideo(video, interests, now);

    expect(a.score).toBe(b.score);
    expect(a.components).toEqual(b.components);
  });

  it("adds a component per matching interest with its weight", () => {
    const video = makeVideo(
      "v1",
      "Rust for beginners",
      ["rust"],
      "2025-06-01T00:00:00.000Z",
    );
    const interests = [makeInterest("rust", 3), makeInterest("web", 2)];

    const scored = scoreVideo(video, interests, now);

    expect(
      scored.components.find((c) => c.reason.includes("rust"))?.value,
    ).toBe(3);
    expect(scored.components.some((c) => c.reason === "recency")).toBe(true);
    expect(scored.modelVersion).toBe(MODEL_VERSION);
  });

  it("ranks higher interest match first", () => {
    const rust = makeVideo(
      "v1",
      "Rust for beginners",
      ["rust"],
      "2025-06-01T00:00:00.000Z",
    );
    const js = makeVideo(
      "v2",
      "JavaScript basics",
      ["js"],
      "2025-06-01T00:00:00.000Z",
    );
    const interests = [makeInterest("rust", 5)];

    const ranked = rankVideos([js, rust], interests, now);

    expect(ranked[0]?.video.id).toBe("v1");
  });

  it("threads the injected now through the model port", async () => {
    const video = makeVideo(
      "v1",
      "Rust for beginners",
      ["rust"],
      "2026-12-31T00:00:00.000Z",
    );
    const interests = [makeInterest("rust", 3)];
    const model = new WeightedTagScoringModel();

    const scored = await model.rank(
      [video],
      interests,
      new Date("2027-06-01T00:00:00.000Z"),
    );

    expect(scored[0]?.score).not.toBeNaN();
  });

  it("does not produce NaN for an unparseable date", () => {
    const video = makeVideo("v1", "Rust", ["rust"], "not-a-date");
    const interests = [makeInterest("rust", 3)];

    const scored = scoreVideo(video, interests, now);

    expect(scored.score).not.toBeNaN();
  });
});
