import { randomUUID } from "node:crypto";
import type { NewPlaylist, Playlist, PlaylistStore } from "../core/index";
import type { Db } from "./db";
import { playlistItems, playlists } from "./schema";

export class DrizzlePlaylistStore implements PlaylistStore {
  constructor(private readonly db: Db) {}

  async save(input: NewPlaylist): Promise<Playlist> {
    const id = randomUUID();
    this.db
      .insert(playlists)
      .values({ id, name: input.name, createdAt: input.createdAt })
      .run();
    for (const [position, videoId] of input.videoIds.entries()) {
      this.db
        .insert(playlistItems)
        .values({ id: randomUUID(), playlistId: id, videoId, position })
        .run();
    }
    return { id, ...input };
  }

  async list(): Promise<Playlist[]> {
    const rows = this.db.select().from(playlists).all();
    const items = this.db.select().from(playlistItems).all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      videoIds: items
        .filter((item) => item.playlistId === row.id)
        .sort((a, b) => a.position - b.position)
        .map((item) => item.videoId),
    }));
  }

  async usedVideoIds(): Promise<string[]> {
    const items = this.db.select().from(playlistItems).all();
    return [...new Set(items.map((item) => item.videoId))];
  }
}
