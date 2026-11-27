import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { DB_NAME, migrations } from './schema';
import { seedDatabase } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** The browser build of SQLite has no full-text search (FTS5): use plain tables there (searched with LIKE). */
export const IS_WEB = Platform.OS === 'web';
function webSql(sql: string): string {
  return sql
    .replace(/PRAGMA journal_mode = WAL;/g, '')
    .replace(/CREATE VIRTUAL TABLE IF NOT EXISTS (\w+) USING fts5\(([^)]*)\);/g, (_m, name: string, cols: string) =>
      `CREATE TABLE IF NOT EXISTS ${name} (${cols.split(',').map((c) => c.trim().split(/\s+/)[0]).filter((c) => c && !c.startsWith('tokenize')).join(', ')});`);
}

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < migrations.length; v++) {
    await db.execAsync(Platform.OS === 'web' ? webSql(migrations[v]!) : migrations[v]!);
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}

/** Opens, migrates and seeds the database exactly once per app process. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      await seedDatabase(db);
      return db;
    })();
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}
