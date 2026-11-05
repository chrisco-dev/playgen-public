import { isRateLimitError, nextDelay } from "./backoff";
import type { BackoffPolicy } from "./backoff";
import type { QuotaLedger } from "./quota-ledger";
import type { SearchProvider } from "./search-provider";
import type { NewVideo, Video } from "./video";
import type { VideoCatalog } from "./video-catalog";

export interface DiscoveryRunDeps {
  search: SearchProvider;
  catalog: VideoCatalog;
  ledger: QuotaLedger;
  sleep: (ms: number) => Promise<void>;
}

export interface DiscoveryRunOptions {
  queries: string[];
  searchCostUnits: number;
  maxAttempts: number;
  backoff: BackoffPolicy;
}

export interface DiscoveryRunResult {
  videos: Video[];
  quotaUsed: number;
  queriesRun: number;
  queriesSkipped: number;
  rateLimited: boolean;
}

interface SearchOutcome {
  results: NewVideo[];
  rateLimited: boolean;
}

async function searchWithRetry(
  deps: DiscoveryRunDeps,
  query: string,
  maxAttempts: number,
  backoff: BackoffPolicy,
): Promise<SearchOutcome> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return { results: await deps.search.search(query), rateLimited: false };
    } catch (error) {
      if (!isRateLimitError(error)) {
        throw error;
      }
      if (attempt === maxAttempts - 1) {
        return { results: [], rateLimited: true };
      }
      await deps.sleep(nextDelay(backoff, attempt));
    }
  }
  return { results: [], rateLimited: true };
}

// One scheduler tick: run quota-aware discovery over a list of queries.
// Quota is reserved before each search; rate-limit responses back off and retry.
export async function runDiscoveryRun(
  deps: DiscoveryRunDeps,
  options: DiscoveryRunOptions,
): Promise<DiscoveryRunResult> {
  const videos: Video[] = [];
  let quotaUsed = 0;
  let queriesRun = 0;
  let rateLimited = false;

  for (const query of options.queries) {
    const reservation = await deps.ledger.reserve(
      options.searchCostUnits,
      `search:${query}`,
    );
    if (reservation.denied) {
      break;
    }
    quotaUsed += reservation.granted;

    const outcome = await searchWithRetry(
      deps,
      query,
      options.maxAttempts,
      options.backoff,
    );
    if (outcome.rateLimited) {
      rateLimited = true;
      break;
    }

    for (const result of outcome.results) {
      videos.push(await deps.catalog.upsert(result));
    }
    queriesRun += 1;
  }

  return {
    videos,
    quotaUsed,
    queriesRun,
    queriesSkipped: options.queries.length - queriesRun,
    rateLimited,
  };
}
