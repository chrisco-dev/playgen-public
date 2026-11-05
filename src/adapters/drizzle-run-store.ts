import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type {
  RunRecord,
  RunStatus,
  RunStore,
  ScheduleKind,
} from "../core/index";
import type { Db } from "./db";
import { runs } from "./schema";

function toRun(row: typeof runs.$inferSelect): RunRecord {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    quotaUsed: row.quotaUsed,
  };
}

export class DrizzleRunStore implements RunStore {
  constructor(private readonly db: Db) {}

  async findLatestCompleted(kind: ScheduleKind): Promise<RunRecord | null> {
    const rows = this.db
      .select()
      .from(runs)
      .where(and(eq(runs.kind, kind), eq(runs.status, "done")))
      .orderBy(desc(runs.startedAt))
      .all();
    return rows[0] ? toRun(rows[0]) : null;
  }

  async create(input: {
    kind: ScheduleKind;
    startedAt: string;
  }): Promise<RunRecord> {
    const row = {
      id: randomUUID(),
      kind: input.kind,
      status: "running" as const,
      startedAt: input.startedAt,
      finishedAt: null,
      quotaUsed: 0,
    };
    this.db.insert(runs).values(row).run();
    return toRun(row);
  }

  async finish(
    id: string,
    status: RunStatus,
    quotaUsed: number,
    finishedAt: string,
  ): Promise<RunRecord> {
    this.db
      .update(runs)
      .set({ status, quotaUsed, finishedAt })
      .where(eq(runs.id, id))
      .run();
    const row = this.db.select().from(runs).where(eq(runs.id, id)).get();
    if (!row) {
      throw new Error(`run ${id} not found`);
    }
    return toRun(row);
  }
}
