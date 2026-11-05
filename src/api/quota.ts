import type { FastifyInstance } from "fastify";
import { quotaStatusSchema } from "../contracts/index";
import {
  DEFAULT_QUOTA_BUDGET,
  discoveryBudget,
  remainingUnits,
} from "../core/index";
import type { QuotaLedger } from "../core/index";

export function registerQuotaRoutes(app: FastifyInstance, ledger: QuotaLedger) {
  app.get("/quota", async () => {
    const used = await ledger.usedToday();
    const entries = await ledger.listEntries();
    return quotaStatusSchema.parse({
      dailyUnits: DEFAULT_QUOTA_BUDGET.dailyUnits,
      reserveFraction: DEFAULT_QUOTA_BUDGET.reserveFraction,
      discoveryBudget: discoveryBudget(DEFAULT_QUOTA_BUDGET),
      used,
      remaining: remainingUnits(DEFAULT_QUOTA_BUDGET, used),
      entries: entries.map((entry) => ({
        id: entry.id,
        bucket: entry.bucket,
        units: entry.units,
        operation: entry.operation,
        createdAt: entry.createdAt,
      })),
    });
  });
}
