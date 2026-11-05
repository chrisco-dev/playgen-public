import { describe, expect, it } from "vitest";
import { composePlaylist } from "./compose-playlist";
import type { ScoredVideo } from "./ranking";

function makeScored(id: string, score: number): ScoredVideo {
  return {
    video: {
      id,
      provider: "p",
      externalId: id,
      title: id,
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 1,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: [],
      firstSeenAt: "x",
    },
    score,
    components: [],
    modelVersion: "v0",
  };
}

const now = new Date("2026-11-05T00:00:00.000Z");

describe("composePlaylist", () => {
  it("selects up to maxItems in ranked order", () => {
    const scored = [
      makeScored("a", 10),
      makeScored("b", 9),
      makeScored("c", 8),
    ];

    const result = composePlaylist(scored, new Set(), { maxItems: 2, now });

    expect(result.videoIds).toEqual(["a", "b"]);
  });

  it("skips already-used videos", () => {
    const scored = [
      makeScored("a", 10),
      makeScored("b", 9),
      makeScored("c", 8),
    ];

    const result = composePlaylist(scored, new Set(["a"]), {
      maxItems: 2,
      now,
    });

    expect(result.videoIds).toEqual(["b", "c"]);
  });

  it("uses a default name with the timestamp", () => {
    const scored = [makeScored("a", 10)];

    const result = composePlaylist(scored, new Set(), { now });

    expect(result.name).toContain(now.toISOString());
  });
});
