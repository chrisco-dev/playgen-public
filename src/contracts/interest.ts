import { z } from "zod";

export const interestSourceSchema = z.enum(["manual", "derived"]);

export const createInterestSchema = z.object({
  label: z.string().trim().min(1).max(200),
  weight: z.number().min(0).max(10).default(1),
  confidence: z.number().min(0).max(1).default(1),
  source: interestSourceSchema.default("manual"),
});

export const updateInterestSchema = createInterestSchema.partial();

export const interestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string(),
  weight: z.number(),
  confidence: z.number(),
  source: interestSourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InterestDto = z.infer<typeof interestSchema>;
export type CreateInterestInput = z.infer<typeof createInterestSchema>;
export type UpdateInterestInput = z.infer<typeof updateInterestSchema>;
