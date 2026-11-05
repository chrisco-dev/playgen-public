import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("playlist routes", () => {
  let deps: ReturnType<typeof makeInMemoryDeps>;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    deps = makeInMemoryDeps();
    app = await buildServer(deps);
  });

  afterEach(async () => {
    await app.close();
  });

  async function seed() {
    await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "rust", weight: 5 },
    });
    await deps.videoCatalog.upsert({
      provider: "fixture",
      externalId: "rust-1",
      title: "Rust for beginners",
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 100,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: ["rust"],
    });
    await deps.videoCatalog.upsert({
      provider: "fixture",
      externalId: "rust-2",
      title: "Rust in production",
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 100,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: ["rust"],
    });
    await deps.videoCatalog.upsert({
      provider: "fixture",
      externalId: "js-1",
      title: "JavaScript basics",
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 100,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: ["js"],
    });
  }

  it("composes a playlist with a watch_videos link", async () => {
    await seed();

    const res = await app.inject({
      method: "POST",
      url: "/playlists",
      payload: {},
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.playlist.videoIds.length).toBeGreaterThan(0);
    expect(body.links).toHaveLength(1);
    expect(body.links[0]).toContain("watch_videos");
  });

  it("deduplicates against previously used videos", async () => {
    await seed();
    await app.inject({
      method: "POST",
      url: "/playlists",
      payload: { maxItems: 1 },
    });

    const second = await app.inject({
      method: "POST",
      url: "/playlists",
      payload: {},
    });
    const list = await app.inject({ method: "GET", url: "/playlists" });
    const firstVideoIds = list.json()[0].videoIds;
    const secondVideoIds = second.json().playlist.videoIds;

    expect(
      secondVideoIds.some((id: string) => firstVideoIds.includes(id)),
    ).toBe(false);
  });

  it("lists playlists", async () => {
    await seed();
    await app.inject({ method: "POST", url: "/playlists", payload: {} });

    const list = await app.inject({ method: "GET", url: "/playlists" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
  });
});
