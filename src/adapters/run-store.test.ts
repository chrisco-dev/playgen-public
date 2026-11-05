import { beforeEach, describe, expect, it } from "vitest";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzleRunStore } from "./drizzle-run-store";

describe("DrizzleRunStore", () => {
  let db: Db;
  let store: DrizzleRunStore;

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
    store = new DrizzleRunStore(db);
  });

  it("creates and finishes a run", async () => {
    const created = await store.create({ kind: "daily", startedAt: "x" });
    expect(created.status).toBe("running");
    expect(created.finishedAt).toBeNull();

    const finished = await store.finish(created.id, "done", 42, "y");
    expect(finished.status).toBe("done");
    expect(finished.quotaUsed).toBe(42);
    expect(finished.finishedAt).toBe("y");
  });

  it("finds the latest completed run", async () => {
    const first = await store.create({
      kind: "daily",
      startedAt: "2026-11-05T18:00:00.000Z",
    });
    await store.finish(first.id, "done", 10, "2026-11-05T18:01:00.000Z");

    const second = await store.create({
      kind: "daily",
      startedAt: "2026-11-05T19:00:00.000Z",
    });
    await store.finish(second.id, "done", 20, "2026-11-05T19:01:00.000Z");

    const latest = await store.findLatestCompleted("daily");
    expect(latest?.id).toBe(second.id);
    expect(latest?.quotaUsed).toBe(20);
  });

  it("ignores non-completed runs", async () => {
    const failed = await store.create({ kind: "daily", startedAt: "x" });
    await store.finish(failed.id, "failed", 0, "y");

    expect(await store.findLatestCompleted("daily")).toBeNull();
  });
});
