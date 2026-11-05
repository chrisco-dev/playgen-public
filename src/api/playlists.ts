import type { FastifyInstance } from "fastify";
import {
  createPlaylistSchema,
  playlistResponseSchema,
  playlistSchema,
} from "../contracts/index";
import {
  DEFAULT_USER_ID,
  composePlaylist,
  watchVideosLinks,
} from "../core/index";
import type {
  Clock,
  InterestRepository,
  PlaylistStore,
  ScoringModel,
  VideoCatalog,
} from "../core/index";

export interface PlaylistDeps {
  clock: Clock;
  interestRepository: InterestRepository;
  videoCatalog: VideoCatalog;
  scoringModel: ScoringModel;
  playlistStore: PlaylistStore;
}

export function registerPlaylistRoutes(
  app: FastifyInstance,
  deps: PlaylistDeps,
) {
  app.get("/playlists", async () => {
    const playlists = await deps.playlistStore.list();
    return playlists.map((p) => playlistSchema.parse(p));
  });

  app.post("/playlists", async (request, reply) => {
    const parsed = createPlaylistSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid request", issues: parsed.error.issues };
    }

    const now = deps.clock.now();
    const interests = await deps.interestRepository.list(DEFAULT_USER_ID);
    const videos = await deps.videoCatalog.list();
    const ranked = await deps.scoringModel.rank(videos, interests, now);
    const used = new Set(await deps.playlistStore.usedVideoIds());

    const composed = composePlaylist(ranked, used, {
      name: parsed.data.name,
      maxItems: parsed.data.maxItems,
      now,
    });
    const saved = await deps.playlistStore.save(composed);

    reply.code(201);
    return playlistResponseSchema.parse({
      playlist: saved,
      links: watchVideosLinks(saved.videoIds),
    });
  });
}
