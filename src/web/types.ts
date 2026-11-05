export interface Interest {
  id: string;
  userId: string;
  label: string;
  weight: number;
  confidence: number;
  source: "manual" | "derived";
  createdAt: string;
  updatedAt: string;
}

export interface ScoreComponent {
  reason: string;
  value: number;
}

export interface ScoredVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  provider: string;
  externalId: string;
  score: number;
  components: ScoreComponent[];
  modelVersion: string;
}

export type SignalKind =
  | "click"
  | "watch"
  | "skip"
  | "like"
  | "dislike"
  | "save"
  | "subscribe";

export interface Signal {
  id: string;
  videoId: string;
  kind: SignalKind;
  polarity: 1 | -1;
  delta: number;
  createdAt: string;
  supersedesId: string | null;
}
