import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Clock } from "../core/index";
import type {
  Interest,
  InterestPatch,
  InterestRepository,
  NewInterest,
} from "../core/index";
import type { Db } from "./db";
import { interests } from "./schema";

export class DrizzleInterestRepository implements InterestRepository {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async list(userId: string): Promise<Interest[]> {
    return this.db
      .select()
      .from(interests)
      .where(eq(interests.userId, userId))
      .all();
  }

  async get(id: string): Promise<Interest | null> {
    return (
      this.db.select().from(interests).where(eq(interests.id, id)).get() ?? null
    );
  }

  async create(input: NewInterest): Promise<Interest> {
    const now = this.clock.now().toISOString();
    const interest: Interest = {
      id: randomUUID(),
      userId: input.userId,
      label: input.label,
      weight: input.weight,
      confidence: input.confidence,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(interests).values(interest).run();
    return interest;
  }

  async update(id: string, patch: InterestPatch): Promise<Interest | null> {
    const existing = await this.get(id);
    if (!existing) {
      return null;
    }
    const updated: Interest = {
      ...existing,
      ...patch,
      updatedAt: this.clock.now().toISOString(),
    };
    this.db.update(interests).set(updated).where(eq(interests.id, id)).run();
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    const result = this.db.delete(interests).where(eq(interests.id, id)).run();
    return result.changes > 0;
  }
}
