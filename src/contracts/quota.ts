import { z } from "zod";

export const quotaEntrySchema = z.object({
  id: z.string(),
  bucket: z.enum(["interactive", "discovery"]),
  units: z.number(),
  operation: z.string(),
  createdAt: z.string(),
});

export const quotaStatusSchema = z.object({
  dailyUnits: z.number(),
  reserveFraction: z.number(),
  discoveryBudget: z.number(),
  used: z.number(),
  remaining: z.number(),
  entries: z.array(quotaEntrySchema),
});

export type QuotaStatusDto = z.infer<typeof quotaStatusSchema>;
