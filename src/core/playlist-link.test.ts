import { describe, expect, it } from "vitest";
import { watchVideosLinks } from "./playlist-link";

describe("watchVideosLinks", () => {
  it("produces a single link for a small list", () => {
    const links = watchVideosLinks(["a", "b", "c"]);

    expect(links).toHaveLength(1);
    expect(links[0]).toContain("video_ids=a,b,c");
  });

  it("chunks lists larger than the limit", () => {
    const ids = Array.from({ length: 120 }, (_, i) => `v${i}`);
    const links = watchVideosLinks(ids, 50);

    expect(links).toHaveLength(3);
    expect(links[0]).toContain("video_ids=v0");
    expect(links[2]).toContain("v100");
  });
});
