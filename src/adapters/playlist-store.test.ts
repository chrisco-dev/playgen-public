import { beforeEach, describe, expect, it } from "vitest";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzlePlaylistStore } from "./drizzle-playlist-store";

describe("DrizzlePlaylistStore", () => {
  let db: Db;
  let store: DrizzlePlaylistStore;

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
    store = new DrizzlePlaylistStore(db);
  });

  it("saves and lists playlists with ordered items", async () => {
    const saved = await store.save({
      name: "Daily",
      videoIds: ["a", "b", "c"],
      createdAt: "2026-11-05T00:00:00.000Z",
    });

    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.videoIds).toEqual(["a", "b", "c"]);
    expect(saved.id).toBe(list[0]?.id);
  });

  it("returns unique used video ids", async () => {
    await store.save({ name: "A", videoIds: ["a", "b"], createdAt: "x" });
    await store.save({ name: "B", videoIds: ["b", "c"], createdAt: "x" });

    const used = await store.usedVideoIds();
    expect(used.sort()).toEqual(["a", "b", "c"]);
  });
});
