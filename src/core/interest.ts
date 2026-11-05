export type InterestSource = "manual" | "derived";

export interface Interest {
  id: string;
  userId: string;
  label: string;
  weight: number;
  confidence: number;
  source: InterestSource;
  createdAt: string;
  updatedAt: string;
}

export interface NewInterest {
  userId: string;
  label: string;
  weight: number;
  confidence: number;
  source: InterestSource;
}

export interface InterestPatch {
  label?: string;
  weight?: number;
  confidence?: number;
  source?: InterestSource;
}
