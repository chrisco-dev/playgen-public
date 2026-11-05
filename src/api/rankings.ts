import type { FastifyInstance } from "fastify";
import { scoredVideoSchema } from "../contracts/index";
import { DEFAULT_USER_ID } from "../core/index";
import type {
  Clock,
  InterestRepository,
  ScoringModel,
  SignalRepository,
  VideoCatalog,
} from "../core/index";

export interface RankingDeps {
  clock: Clock;
  interestRepository: InterestRepository;
  videoCatalog: VideoCatalog;
  scoringModel: ScoringModel;
  signalRepository: SignalRepository;
}

export function registerRankingRoutes(app: FastifyInstance, deps: RankingDeps) {
  app.get("/rankings", async () => {
    const interests = await deps.interestRepository.list(DEFAULT_USER_ID);
    const videos = await deps.videoCatalog.list();
    const liveSignals = await deps.signalRepository.listLive();
    const ranked = await deps.scoringModel.rank(
      videos,
      interests,
      deps.clock.now(),
      liveSignals,
    );
    return ranked.map((item) =>
      scoredVideoSchema.parse({
        videoId: item.video.id,
        title: item.video.title,
        channelTitle: item.video.channelTitle,
        provider: item.video.provider,
        externalId: item.video.externalId,
        score: item.score,
        components: item.components,
        modelVersion: item.modelVersion,
      }),
    );
  });
}
