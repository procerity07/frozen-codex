/* Minimal expo-sqlite-compatible adapter over node:sqlite, used only by Node verification scripts. */
import { DatabaseSync } from 'node:sqlite';

type P = (string | number | null)[];
const flat = (a: unknown[]): P => (a.length === 1 && Array.isArray(a[0]) ? (a[0] as P) : (a as P));

export function nodeDb(path = ':memory:') {
  const d = new DatabaseSync(path);
  return {
    raw: d,
    async execAsync(sql: string) { d.exec(sql.replace(/PRAGMA journal_mode = WAL;/, '')); },
    async runAsync(sql: string, ...a: unknown[]) { const r = d.prepare(sql).run(...flat(a)); return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) }; },
    async getAllAsync<T>(sql: string, ...a: unknown[]) { return d.prepare(sql).all(...flat(a)) as T[]; },
    async getFirstAsync<T>(sql: string, ...a: unknown[]) { return (d.prepare(sql).get(...flat(a)) ?? null) as T | null; },
    async withTransactionAsync(task: () => Promise<void>) { d.exec('BEGIN'); try { await task(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; } },
  };
}
