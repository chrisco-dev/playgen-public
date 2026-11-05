import { beforeEach, describe, expect, it } from "vitest";
import { createDb, migrateDb } from "./db";
import type { Db } from "./db";
import { DrizzleInterestRepository } from "./drizzle-interest-repository";
import { SystemClock } from "./system-clock";

describe("DrizzleInterestRepository", () => {
  let db: Db;
  let repo: DrizzleInterestRepository;

  beforeEach(() => {
    db = createDb(":memory:");
    migrateDb(db);
    repo = new DrizzleInterestRepository(db, new SystemClock());
  });

  it("creates, lists, updates, and removes an interest", async () => {
    const created = await repo.create({
      userId: "u1",
      label: "AI",
      weight: 1,
      confidence: 1,
      source: "manual",
    });

    const list = await repo.list("u1");
    expect(list).toHaveLength(1);
    expect(list[0]?.label).toBe("AI");

    const updated = await repo.update(created.id, { weight: 3 });
    expect(updated?.weight).toBe(3);
    expect(updated?.label).toBe("AI");

    expect(await repo.remove(created.id)).toBe(true);
    expect(await repo.get(created.id)).toBeNull();
  });

  it("returns null for a missing id on get and update", async () => {
    expect(await repo.get("nope")).toBeNull();
    expect(await repo.update("nope", { label: "x" })).toBeNull();
  });
});
