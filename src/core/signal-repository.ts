import type { NewSignal, Signal } from "./signal";

export interface SignalRepository {
  record(signal: NewSignal): Promise<Signal>;
  list(): Promise<Signal[]>;
  get(id: string): Promise<Signal | null>;
  listLive(): Promise<Signal[]>;
}
