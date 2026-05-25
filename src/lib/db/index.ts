import Database from "@tauri-apps/plugin-sql";

let _db: Database | null = null;
let _pending: Promise<Database> | null = null;

const DB_URL = "sqlite:ascend.db";

/**
 * Returns a singleton SQLite connection.
 *
 * In a browser preview (non-Tauri) this throws — callers should be guarded with
 * `isTauri()` from `@/lib/env`.
 */
export async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_pending) return _pending;
  _pending = Database.load(DB_URL).then((db) => {
    _db = db;
    return db;
  });
  return _pending;
}

export async function exec(sql: string, args: unknown[] = []): Promise<void> {
  const db = await getDb();
  await db.execute(sql, args);
}

export async function query<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return db.select<T[]>(sql, args);
}

export async function queryOne<T>(sql: string, args: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}
