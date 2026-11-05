import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type {
  NewSignal,
  Polarity,
  Signal,
  SignalRepository,
} from "../core/index";
import type { Db } from "./db";
import { signals } from "./schema";

function toSignal(row: typeof signals.$inferSelect): Signal {
  return {
    id: row.id,
    videoId: row.videoId,
    kind: row.kind,
    polarity: row.polarity as Polarity,
    delta: row.delta,
    createdAt: row.createdAt,
    supersedesId: row.supersedesId,
  };
}

export class DrizzleSignalRepository implements SignalRepository {
  constructor(private readonly db: Db) {}

  async record(input: NewSignal): Promise<Signal> {
    const row = { id: randomUUID(), ...input };
    this.db.insert(signals).values(row).run();
    return toSignal(row);
  }

  async list(): Promise<Signal[]> {
    return this.db.select().from(signals).all().map(toSignal);
  }

  async get(id: string): Promise<Signal | null> {
    const row = this.db.select().from(signals).where(eq(signals.id, id)).get();
    return row ? toSignal(row) : null;
  }

  async listLive(): Promise<Signal[]> {
    const rows = this.db.select().from(signals).all();
    const superseded = new Set(
      rows.flatMap((r) => (r.supersedesId ? [r.supersedesId] : [])),
    );
    return rows.filter((r) => !superseded.has(r.id)).map(toSignal);
  }
}
