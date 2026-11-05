import type { NewVideo, SearchProvider } from "../core/index";

const FIXTURE_CHANNELS = ["Example Channel", "Maker Lab", "Deep Dives"];

export class FixtureSearchProvider implements SearchProvider {
  async search(query: string): Promise<NewVideo[]> {
    return FIXTURE_CHANNELS.map((channelTitle, index) => ({
      provider: "fixture",
      externalId: `${query}-${index + 1}`,
      title: `${query} — part ${index + 1}`,
      channelId: `channel-${index + 1}`,
      channelTitle,
      durationSeconds: 300 + index * 60,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: [query, "fixture"],
    }));
  }
}
