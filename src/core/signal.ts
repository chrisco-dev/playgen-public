export type SignalKind =
  | "click"
  | "watch"
  | "skip"
  | "like"
  | "dislike"
  | "save"
  | "subscribe";

export type Polarity = 1 | -1;

export interface Signal {
  id: string;
  videoId: string;
  kind: SignalKind;
  polarity: Polarity;
  delta: number;
  createdAt: string;
  supersedesId: string | null;
}

export interface NewSignal {
  videoId: string;
  kind: SignalKind;
  polarity: Polarity;
  delta: number;
  createdAt: string;
  supersedesId: string | null;
}
