import {
  DrizzleInterestRepository,
  DrizzlePlaylistStore,
  DrizzleQuotaLedger,
  DrizzleRunStore,
  DrizzleSignalRepository,
  DrizzleVideoCatalog,
  FixtureSearchProvider,
  LinkExporter,
  SystemClock,
  createDb,
  migrateDb,
} from "../adapters/index";
import {
  DEFAULT_BACKOFF,
  DEFAULT_QUOTA_BUDGET,
  DEFAULT_SCHEDULE,
  DEFAULT_USER_ID,
  WeightedTagScoringModel,
  runDiscoveryRun,
  runScheduledPlaylist,
} from "../core/index";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const clock = new SystemClock();
const db = createDb(process.env.DATABASE_PATH ?? "playgen.db");
migrateDb(db);

const interestRepository = new DrizzleInterestRepository(db, clock);
const videoCatalog = new DrizzleVideoCatalog(db, clock);
const scoringModel = new WeightedTagScoringModel();
const signalRepository = new DrizzleSignalRepository(db);
const playlistStore = new DrizzlePlaylistStore(db);

// Discovery tick: quota-aware background search over the current interests.
const queries = (await interestRepository.list(DEFAULT_USER_ID)).map(
  (interest) => interest.label,
);
const result = await runDiscoveryRun(
  {
    search: new FixtureSearchProvider(),
    catalog: videoCatalog,
    ledger: new DrizzleQuotaLedger(db, clock, DEFAULT_QUOTA_BUDGET),
    sleep,
  },
  {
    queries,
    searchCostUnits: 100,
    maxAttempts: 3,
    backoff: DEFAULT_BACKOFF,
  },
);
console.log(
  `discovery tick: ${result.queriesRun} queries, ${result.videos.length} videos saved, ${result.quotaUsed} quota units used, ${result.queriesSkipped} skipped${result.rateLimited ? ", rate-limited" : ""}`,
);

// Scheduled playlist runs: daily and weekly, idempotent within their period.
const scheduledDeps = {
  clock,
  runStore: new DrizzleRunStore(db),
  interestRepository,
  videoCatalog,
  scoringModel,
  signalRepository,
  playlistStore,
  writer: new LinkExporter(),
};
const daily = await runScheduledPlaylist(
  scheduledDeps,
  "daily",
  DEFAULT_SCHEDULE,
);
const weekly = await runScheduledPlaylist(
  scheduledDeps,
  "weekly",
  DEFAULT_SCHEDULE,
);
console.log(
  `scheduled runs: daily ${daily ? "ran" : "skipped"}, weekly ${weekly ? "ran" : "skipped"}`,
);
