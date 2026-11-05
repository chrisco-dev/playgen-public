import { z } from "zod";

export const scoreComponentSchema = z.object({
  reason: z.string(),
  value: z.number(),
});

export const scoredVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  provider: z.string(),
  externalId: z.string(),
  score: z.number(),
  components: z.array(scoreComponentSchema),
  modelVersion: z.string(),
});

export type ScoredVideoDto = z.infer<typeof scoredVideoSchema>;
