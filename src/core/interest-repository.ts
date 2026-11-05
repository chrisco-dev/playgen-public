import type { Interest, InterestPatch, NewInterest } from "./interest";

export interface InterestRepository {
  list(userId: string): Promise<Interest[]>;
  get(id: string): Promise<Interest | null>;
  create(input: NewInterest): Promise<Interest>;
  update(id: string, patch: InterestPatch): Promise<Interest | null>;
  remove(id: string): Promise<boolean>;
}
