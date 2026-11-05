import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("ranking routes", () => {
  let deps: ReturnType<typeof makeInMemoryDeps>;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    deps = makeInMemoryDeps();
    app = await buildServer(deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it("ranks videos by interest match and exposes the explanation", async () => {
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
      externalId: "js-1",
      title: "JavaScript basics",
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 100,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: ["js"],
    });

    const res = await app.inject({ method: "GET", url: "/rankings" });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe("Rust for beginners");
    expect(body[0].score).toBeGreaterThan(body[1].score);
    expect(
      body[0].components.some((c: { reason: string }) =>
        c.reason.includes("rust"),
      ),
    ).toBe(true);
  });

  it("flipping a signal changes the next ranking", async () => {
    await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "rust", weight: 5 },
    });
    const video = await deps.videoCatalog.upsert({
      provider: "fixture",
      externalId: "rust-1",
      title: "Rust for beginners",
      channelId: "c",
      channelTitle: "C",
      durationSeconds: 100,
      publishedAt: "2026-01-01T00:00:00.000Z",
      tags: ["rust"],
    });

    const baseline = await app.inject({ method: "GET", url: "/rankings" });
    const scoreBefore = baseline.json()[0].score;

    const created = await app.inject({
      method: "POST",
      url: "/signals",
      payload: { videoId: video.id, kind: "dislike" },
    });
    const id = created.json().id;

    const disliked = await app.inject({ method: "GET", url: "/rankings" });
    const scoreDisliked = disliked.json()[0].score;

    await app.inject({ method: "POST", url: `/signals/${id}/flip` });

    const flipped = await app.inject({ method: "GET", url: "/rankings" });
    const scoreFlipped = flipped.json()[0].score;

    expect(scoreDisliked).toBeLessThan(scoreBefore);
    expect(scoreFlipped).toBeGreaterThan(scoreDisliked);
  });
});
