import type { Bucket } from "./quota";

export interface QuotaEntry {
  id: string;
  runId: string | null;
  bucket: Bucket;
  units: number;
  operation: string;
  createdAt: string;
}

export interface Reservation {
  requested: number;
  granted: number;
  denied: boolean;
}

export interface QuotaLedger {
  reserve(units: number, operation: string): Promise<Reservation>;
  usedToday(): Promise<number>;
  listEntries(): Promise<QuotaEntry[]>;
}
