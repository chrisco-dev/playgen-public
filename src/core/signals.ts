import type { NewSignal, Polarity, Signal, SignalKind } from "./signal";

const NEGATIVE_KINDS: SignalKind[] = ["skip", "dislike"];

export function defaultPolarity(kind: SignalKind): Polarity {
  return NEGATIVE_KINDS.includes(kind) ? -1 : 1;
}

export function flipSignal(
  original: Signal,
  now: Date,
  delta = original.delta,
): NewSignal {
  return {
    videoId: original.videoId,
    kind: original.kind,
    polarity: (original.polarity * -1) as Polarity,
    delta,
    createdAt: now.toISOString(),
    supersedesId: original.id,
  };
}

export function effectiveWeight(base: number, liveSignals: Signal[]): number {
  return liveSignals.reduce(
    (sum, signal) => sum + signal.polarity * signal.delta,
    base,
  );
}
