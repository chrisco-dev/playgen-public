import { randomUUID } from "node:crypto";
import { grantUnits } from "../core/index";
import type {
  Clock,
  QuotaBudget,
  QuotaEntry,
  QuotaLedger,
  Reservation,
} from "../core/index";
import type { Db } from "./db";
import { quotaLedger } from "./schema";

export class DrizzleQuotaLedger implements QuotaLedger {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
    private readonly budget: QuotaBudget,
  ) {}

  async reserve(units: number, operation: string): Promise<Reservation> {
    const used = await this.usedToday();
    const granted = grantUnits(this.budget, used, units);
    if (granted < units) {
      return { requested: units, granted: 0, denied: true };
    }
    this.db
      .insert(quotaLedger)
      .values({
        id: randomUUID(),
        runId: null,
        bucket: "discovery",
        units: granted,
        operation,
        createdAt: this.clock.now().toISOString(),
      })
      .run();
    return { requested: units, granted, denied: false };
  }

  async usedToday(): Promise<number> {
    const today = this.clock.now().toISOString().slice(0, 10);
    const rows = this.db.select().from(quotaLedger).all();
    return rows
      .filter(
        (row) =>
          row.bucket === "discovery" && row.createdAt.slice(0, 10) === today,
      )
      .reduce((sum, row) => sum + row.units, 0);
  }

  async listEntries(): Promise<QuotaEntry[]> {
    return this.db
      .select()
      .from(quotaLedger)
      .all()
      .map((row) => ({
        id: row.id,
        runId: row.runId,
        bucket: row.bucket,
        units: row.units,
        operation: row.operation,
        createdAt: row.createdAt,
      }));
  }
}
