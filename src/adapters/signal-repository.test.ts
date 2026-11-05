import { beforeEach, describe, expect, it } from "vitest";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzleSignalRepository } from "./drizzle-signal-repository";

describe("DrizzleSignalRepository", () => {
  let db: Db;
  let repo: DrizzleSignalRepository;

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
    repo = new DrizzleSignalRepository(db);
  });

  it("records and lists signals", async () => {
    await repo.record({
      videoId: "v1",
      kind: "click",
      polarity: 1,
      delta: 1,
      createdAt: "x",
      supersedesId: null,
    });

    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.polarity).toBe(1);
  });

  it("listLive excludes superseded signals", async () => {
    const original = await repo.record({
      videoId: "v1",
      kind: "click",
      polarity: 1,
      delta: 1,
      createdAt: "x",
      supersedesId: null,
    });
    await repo.record({
      videoId: "v1",
      kind: "click",
      polarity: -1,
      delta: 1,
      createdAt: "y",
      supersedesId: original.id,
    });

    const live = await repo.listLive();
    expect(live).toHaveLength(1);
    expect(live[0]?.polarity).toBe(-1);
  });
});
