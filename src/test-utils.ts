import {
  DrizzleInterestRepository,
  DrizzlePlaylistStore,
  DrizzleQuotaLedger,
  DrizzleRunStore,
  DrizzleSignalRepository,
  DrizzleVideoCatalog,
  SystemClock,
  createDb,
  migrateDb,
} from "./adapters/index";
import { DEFAULT_QUOTA_BUDGET, WeightedTagScoringModel } from "./core/index";
import type { Clock } from "./core/index";

export class FixedClock implements Clock {
  private readonly value: Date;

  constructor(value: Date = new Date("2026-11-05T00:00:00.000Z")) {
    this.value = value;
  }

  now(): Date {
    return this.value;
  }
}

export function makeInMemoryDeps(clock: Clock = new FixedClock()) {
  const db = createDb(":memory:");
  migrateDb(db);
  return {
    clock,
    interestRepository: new DrizzleInterestRepository(db, clock),
    videoCatalog: new DrizzleVideoCatalog(db, clock),
    scoringModel: new WeightedTagScoringModel(),
    playlistStore: new DrizzlePlaylistStore(db),
    signalRepository: new DrizzleSignalRepository(db),
    quotaLedger: new DrizzleQuotaLedger(db, clock, DEFAULT_QUOTA_BUDGET),
    runStore: new DrizzleRunStore(db),
  };
}
