import * as SQLite from 'expo-sqlite';
import { DB_NAME, migrations } from './schema';
import { seedDatabase } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < migrations.length; v++) {
    await db.execAsync(migrations[v]!);
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
