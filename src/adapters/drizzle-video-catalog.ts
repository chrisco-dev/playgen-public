import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Clock, NewVideo, Video, VideoCatalog } from "../core/index";
import type { Db } from "./db";
import { videos } from "./schema";

export class DrizzleVideoCatalog implements VideoCatalog {
  constructor(
    private readonly db: Db,
    private readonly clock: Clock,
  ) {}

  async upsert(video: NewVideo): Promise<Video> {
    const existing = this.db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.provider, video.provider),
          eq(videos.externalId, video.externalId),
        ),
      )
      .get();
    if (existing) {
      return existing;
    }
    const row: Video = {
      id: randomUUID(),
      ...video,
      firstSeenAt: this.clock.now().toISOString(),
    };
    this.db.insert(videos).values(row).onConflictDoNothing().run();
    return row;
  }

  async list(): Promise<Video[]> {
    return this.db.select().from(videos).all();
  }
}
