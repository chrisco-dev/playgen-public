import { z } from "zod";

export const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  videoIds: z.array(z.string()),
  createdAt: z.string(),
});

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  maxItems: z.number().int().min(1).max(100).optional(),
});

export const playlistResponseSchema = z.object({
  playlist: playlistSchema,
  links: z.array(z.string()),
});

export type PlaylistDto = z.infer<typeof playlistSchema>;
export type PlaylistResponseDto = z.infer<typeof playlistResponseSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
