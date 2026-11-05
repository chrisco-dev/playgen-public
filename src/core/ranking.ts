import type { Interest } from "./interest";
import type { Signal } from "./signal";
import { effectiveWeight } from "./signals";
import type { Video } from "./video";

export const MODEL_VERSION = "weighted-tags-v0";

export interface ScoreComponent {
  reason: string;
  value: number;
}

export interface ScoredVideo {
  video: Video;
  score: number;
  components: ScoreComponent[];
  modelVersion: string;
}

export interface ScoringModel {
  rank(
    videos: Video[],
    interests: Interest[],
    now: Date,
    liveSignals?: Signal[],
  ): Promise<ScoredVideo[]>;
}

const MS_PER_DAY = 86_400_000;

export function interestMatchesVideo(
  interest: Interest,
  video: Video,
): boolean {
  const label = interest.label.toLowerCase();
  return [video.title, video.channelTitle, ...video.tags].some((text) =>
    text.toLowerCase().includes(label),
  );
}

export function effectiveWeightForInterest(
  interest: Interest,
  videos: Video[],
  liveSignals: Signal[],
): number {
  const matchedIds = new Set(
    videos
      .filter((video) => interestMatchesVideo(interest, video))
      .map((video) => video.id),
  );
  const relevant = liveSignals.filter((signal) =>
    matchedIds.has(signal.videoId),
  );
  return effectiveWeight(interest.weight, relevant);
}

function effectiveWeights(
  interests: Interest[],
  videos: Video[],
  liveSignals: Signal[],
): Map<string, number> {
  return new Map(
    interests.map((interest) => [
      interest.id,
      effectiveWeightForInterest(interest, videos, liveSignals),
    ]),
  );
}

function scoreVideoWithWeights(
  video: Video,
  interests: Interest[],
  now: Date,
  weights: Map<string, number>,
): ScoredVideo {
  const components: ScoreComponent[] = [];

  let interestScore = 0;
  for (const interest of interests) {
    if (interestMatchesVideo(interest, video)) {
      const weight = weights.get(interest.id) ?? interest.weight;
      interestScore += weight;
      components.push({
        reason: `matches interest "${interest.label}"`,
        value: weight,
      });
    }
  }

  const published = Date.parse(video.publishedAt);
  const ageDays = Number.isNaN(published)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, (now.getTime() - published) / MS_PER_DAY);
  const recency = Number.isFinite(ageDays) ? Math.max(0, 1 - ageDays / 365) : 0;
  components.push({ reason: "recency", value: recency });

  return {
    video,
    score: interestScore + recency,
    components,
    modelVersion: MODEL_VERSION,
  };
}

export function scoreVideo(
  video: Video,
  interests: Interest[],
  now: Date = new Date(),
  liveSignals: Signal[] = [],
): ScoredVideo {
  return scoreVideoWithWeights(
    video,
    interests,
    now,
    effectiveWeights(interests, [video], liveSignals),
  );
}

export function rankVideos(
  videos: Video[],
  interests: Interest[],
  now: Date = new Date(),
  liveSignals: Signal[] = [],
): ScoredVideo[] {
  const weights = effectiveWeights(interests, videos, liveSignals);
  return videos
    .map((video) => scoreVideoWithWeights(video, interests, now, weights))
    .sort((a, b) => b.score - a.score);
}

export class WeightedTagScoringModel implements ScoringModel {
  async rank(
    videos: Video[],
    interests: Interest[],
    now: Date,
    liveSignals: Signal[] = [],
  ): Promise<ScoredVideo[]> {
    return rankVideos(videos, interests, now, liveSignals);
  }
}
