import { z } from "zod";

export const signalKindSchema = z.enum([
  "click",
  "watch",
  "skip",
  "like",
  "dislike",
  "save",
  "subscribe",
]);

export const polaritySchema = z.union([z.literal(1), z.literal(-1)]);

export const createSignalSchema = z.object({
  videoId: z.string().min(1),
  kind: signalKindSchema,
  delta: z.number().positive().default(1),
});

export const signalSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  kind: signalKindSchema,
  polarity: polaritySchema,
  delta: z.number(),
  createdAt: z.string(),
  supersedesId: z.string().nullable(),
});

export type SignalDto = z.infer<typeof signalSchema>;
export type CreateSignalInput = z.infer<typeof createSignalSchema>;
