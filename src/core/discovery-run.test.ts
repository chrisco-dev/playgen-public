import { describe, expect, it } from "vitest";
import type { BackoffPolicy } from "./backoff";
import { runDiscoveryRun } from "./discovery-run";
import { RateLimitExceededError, remainingUnits } from "./quota";
import type { QuotaBudget } from "./quota";
import type { QuotaEntry, QuotaLedger, Reservation } from "./quota-ledger";
import type { SearchProvider } from "./search-provider";
import type { NewVideo, Video } from "./video";
import type { VideoCatalog } from "./video-catalog";

class FakeLedger implements QuotaLedger {
  entries: QuotaEntry[] = [];
  used = 0;

  constructor(private readonly budget: QuotaBudget) {}

  async reserve(units: number, operation: string): Promise<Reservation> {
    if (remainingUnits(this.budget, this.used) < units) {
      return { requested: units, granted: 0, denied: true };
    }
    this.used += units;
    this.entries.push({
      id: `e${this.entries.length}`,
      runId: null,
      bucket: "discovery",
      units,
      operation,
      createdAt: "x",
    });
    return { requested: units, granted: units, denied: false };
  }

  async usedToday(): Promise<number> {
    return this.used;
  }

  async listEntries(): Promise<QuotaEntry[]> {
    return this.entries;
  }
}

class FakeSearch implements SearchProvider {
  calls = 0;

  constructor(private readonly rateLimitFailures = 0) {}

  async search(query: string): Promise<NewVideo[]> {
    this.calls += 1;
    if (this.calls <= this.rateLimitFailures) {
      throw new RateLimitExceededError();
    }
    return [
      {
        provider: "fixture",
        externalId: `${query}-1`,
        title: query,
        channelId: "c1",
        channelTitle: "ch",
        durationSeconds: 60,
        publishedAt: "x",
        tags: [query],
      },
    ];
  }
}

class FakeCatalog implements VideoCatalog {
  saved: NewVideo[] = [];

  async upsert(video: NewVideo): Promise<Video> {
    this.saved.push(video);
    return { ...video, id: `id-${this.saved.length}`, firstSeenAt: "x" };
  }

  async list(): Promise<Video[]> {
    return [];
  }
}

const backoff: BackoffPolicy = {
  initialDelayMs: 10,
  maxDelayMs: 100,
  factor: 2,
};
const budget: QuotaBudget = { dailyUnits: 1000, reserveFraction: 0.5 };

function makeDeps(options: { rateLimitFailures?: number } = {}) {
  const ledger = new FakeLedger(budget);
  const search = new FakeSearch(options.rateLimitFailures ?? 0);
  const catalog = new FakeCatalog();
  const sleeps: number[] = [];
  return {
    ledger,
    search,
    catalog,
    sleeps,
    deps: {
      search,
      catalog,
      ledger,
      sleep: async (ms: number) => {
        sleeps.push(ms);
      },
    },
  };
}

describe("runDiscoveryRun", () => {
  it("runs every query within budget and saves videos", async () => {
    const { deps, ledger, catalog } = makeDeps();

    const result = await runDiscoveryRun(deps, {
      queries: ["a", "b"],
      searchCostUnits: 100,
      maxAttempts: 3,
      backoff,
    });

    expect(result.queriesRun).toBe(2);
    expect(result.queriesSkipped).toBe(0);
    expect(result.quotaUsed).toBe(200);
    expect(result.rateLimited).toBe(false);
    expect(catalog.saved).toHaveLength(2);
    expect(ledger.entries).toHaveLength(2);
  });

  it("stops when the budget is exhausted", async () => {
    const { deps, ledger } = makeDeps();
    const queries = ["a", "b", "c", "d", "e", "f", "g"];

    const result = await runDiscoveryRun(deps, {
      queries,
      searchCostUnits: 100,
      maxAttempts: 3,
      backoff,
    });

    expect(result.queriesRun).toBe(5);
    expect(result.queriesSkipped).toBe(2);
    expect(result.quotaUsed).toBe(500);
    expect(ledger.entries).toHaveLength(5);
  });

  it("backs off and retries on rate-limit", async () => {
    const { deps, sleeps, search } = makeDeps({ rateLimitFailures: 1 });

    const result = await runDiscoveryRun(deps, {
      queries: ["a"],
      searchCostUnits: 100,
      maxAttempts: 3,
      backoff,
    });

    expect(search.calls).toBe(2);
    expect(sleeps).toEqual([10]);
    expect(result.rateLimited).toBe(false);
    expect(result.queriesRun).toBe(1);
  });

  it("marks rate-limited and stops when retries are exhausted", async () => {
    const { deps, sleeps, search } = makeDeps({ rateLimitFailures: 99 });

    const result = await runDiscoveryRun(deps, {
      queries: ["a", "b"],
      searchCostUnits: 100,
      maxAttempts: 3,
      backoff,
    });

    expect(search.calls).toBe(3);
    expect(sleeps).toEqual([10, 20]);
    expect(result.rateLimited).toBe(true);
    expect(result.queriesRun).toBe(0);
  });
});
