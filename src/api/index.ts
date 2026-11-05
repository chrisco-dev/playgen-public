import {
  DrizzleInterestRepository,
  DrizzlePlaylistStore,
  DrizzleQuotaLedger,
  DrizzleSignalRepository,
  DrizzleVideoCatalog,
  SystemClock,
  createDb,
  migrateDb,
} from "../adapters/index";
import { DEFAULT_QUOTA_BUDGET, WeightedTagScoringModel } from "../core/index";
import { buildServer } from "./server";

const port = Number(process.env.PORT ?? 3000);
const clock = new SystemClock();
const db = createDb(process.env.DATABASE_PATH ?? "playgen.db");
migrateDb(db);

const app = await buildServer({
  clock,
  interestRepository: new DrizzleInterestRepository(db, clock),
  videoCatalog: new DrizzleVideoCatalog(db, clock),
  scoringModel: new WeightedTagScoringModel(),
  playlistStore: new DrizzlePlaylistStore(db),
  signalRepository: new DrizzleSignalRepository(db),
  quotaLedger: new DrizzleQuotaLedger(db, clock, DEFAULT_QUOTA_BUDGET),
});

try {
  await app.listen({ port, host: "127.0.0.1" });
  app.log.info(`listening on http://127.0.0.1:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
