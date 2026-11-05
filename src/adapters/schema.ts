import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const interests = sqliteTable("interests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  weight: real("weight").notNull(),
  confidence: real("confidence").notNull(),
  source: text("source", { enum: ["manual", "derived"] }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    channelId: text("channel_id").notNull(),
    channelTitle: text("channel_title").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    publishedAt: text("published_at").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
    firstSeenAt: text("first_seen_at").notNull(),
  },
  (table) => [
    uniqueIndex("videos_provider_external_unique").on(
      table.provider,
      table.externalId,
    ),
  ],
);

export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const playlistItems = sqliteTable("playlist_items", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id").notNull(),
  videoId: text("video_id").notNull(),
  position: integer("position").notNull(),
});

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  videoId: text("video_id").notNull(),
  kind: text("kind", {
    enum: ["click", "watch", "skip", "like", "dislike", "save", "subscribe"],
  }).notNull(),
  polarity: integer("polarity").notNull(),
  delta: real("delta").notNull(),
  createdAt: text("created_at").notNull(),
  supersedesId: text("supersedes_id"),
});

export const quotaLedger = sqliteTable("quota_ledger", {
  id: text("id").primaryKey(),
  runId: text("run_id"),
  bucket: text("bucket", { enum: ["interactive", "discovery"] }).notNull(),
  units: real("units").notNull(),
  operation: text("operation").notNull(),
  createdAt: text("created_at").notNull(),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["daily", "weekly"] }).notNull(),
  status: text("status", { enum: ["running", "done", "failed"] }).notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  quotaUsed: real("quota_used").notNull(),
});
