import { describe, expect, it } from "vitest";
import { discover } from "./discovery";
import type { NewVideo, SearchProvider, Video, VideoCatalog } from "./index";

class FakeSearch implements SearchProvider {
  results: NewVideo[] = [];

  async search(_query: string): Promise<NewVideo[]> {
    return this.results;
  }
}

class FakeCatalog implements VideoCatalog {
  saved: Video[] = [];

  async upsert(video: NewVideo): Promise<Video> {
    const row: Video = {
      id: `id-${this.saved.length + 1}`,
      ...video,
      firstSeenAt: "2026-01-01T00:00:00.000Z",
    };
    this.saved.push(row);
    return row;
  }

  async list(): Promise<Video[]> {
    return this.saved;
  }
}

function makeVideo(externalId: string): NewVideo {
  return {
    provider: "p",
    externalId,
    title: externalId,
    channelId: "c",
    channelTitle: "C",
    durationSeconds: 1,
    publishedAt: "2026-01-01T00:00:00.000Z",
    tags: [],
  };
}

describe("discover", () => {
  it("searches and persists every result", async () => {
    const search = new FakeSearch();
    search.results = [makeVideo("a"), makeVideo("b")];
    const catalog = new FakeCatalog();

    const saved = await discover("q", search, catalog);

    expect(saved).toHaveLength(2);
    expect(catalog.saved).toHaveLength(2);
    expect(saved[0]?.externalId).toBe("a");
    expect(saved[1]?.externalId).toBe("b");
  });

  it("returns an empty list when there are no results", async () => {
    const search = new FakeSearch();
    const catalog = new FakeCatalog();

    const saved = await discover("nothing", search, catalog);

    expect(saved).toHaveLength(0);
  });
});
