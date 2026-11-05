import { beforeEach, describe, expect, it } from "vitest";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzleVideoCatalog } from "./drizzle-video-catalog";
import { SystemClock } from "./system-clock";

const sample = {
  provider: "fixture",
  externalId: "rust-1",
  title: "Rust — part 1",
  channelId: "channel-1",
  channelTitle: "Example Channel",
  durationSeconds: 300,
  publishedAt: "2026-01-01T00:00:00.000Z",
  tags: ["rust", "fixture"],
};

describe("DrizzleVideoCatalog", () => {
  let db: Db;
  let catalog: DrizzleVideoCatalog;

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
    catalog = new DrizzleVideoCatalog(db, new SystemClock());
  });

  it("deduplicates by provider and externalId", async () => {
    const first = await catalog.upsert(sample);
    const second = await catalog.upsert(sample);

    expect(second.id).toBe(first.id);
    expect(await catalog.list()).toHaveLength(1);
  });

  it("stores tags and lists videos", async () => {
    await catalog.upsert(sample);

    const list = await catalog.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.tags).toEqual(["rust", "fixture"]);
  });
});
