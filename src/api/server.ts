import Fastify from "fastify";
import { healthResponseSchema } from "../contracts/index";
import type {
  Clock,
  InterestRepository,
  PlaylistStore,
  QuotaLedger,
  ScoringModel,
  SignalRepository,
  VideoCatalog,
} from "../core/index";
import { registerInterestRoutes } from "./interests";
import { registerPlaylistRoutes } from "./playlists";
import { registerQuotaRoutes } from "./quota";
import { registerRankingRoutes } from "./rankings";
import { registerSignalRoutes } from "./signals";

export interface ServerDeps {
  clock: Clock;
  interestRepository: InterestRepository;
  videoCatalog: VideoCatalog;
  scoringModel: ScoringModel;
  playlistStore: PlaylistStore;
  signalRepository: SignalRepository;
  quotaLedger: QuotaLedger;
}

export async function buildServer(deps: ServerDeps) {
  const app = Fastify();

  app.get("/health", () => {
    return healthResponseSchema.parse({
      status: "ok",
      time: deps.clock.now().toISOString(),
    });
  });

  registerInterestRoutes(app, deps.interestRepository);
  registerRankingRoutes(app, deps);
  registerPlaylistRoutes(app, deps);
  registerSignalRoutes(app, deps);
  registerQuotaRoutes(app, deps.quotaLedger);

  return app;
}
