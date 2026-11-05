import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

export function createDb(filename = ":memory:"): Db {
  const sqlite = new Database(filename);
  sqlite.pragma("journal_mode = WAL");
  return drizzle(sqlite, { schema });
}

export function migrateDb(db: Db, migrationsFolder = "drizzle"): void {
  migrate(db, { migrationsFolder });
}
