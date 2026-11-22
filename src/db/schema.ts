export const DB_NAME = 'frozen-codex.db';

/** Ordered migrations. Index + 1 = schema version. */
export const migrations: string[] = [
  `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS heroes (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, element TEXT NOT NULL, rarity INTEGER NOT NULL,
    unit_type TEXT NOT NULL, data TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'seed'
  );
  CREATE INDEX IF NOT EXISTS idx_heroes_filter ON heroes (element, rarity, unit_type);
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, cycle_week TEXT NOT NULL,
    data TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'seed'
  );
  CREATE TABLE IF NOT EXISTS sophia (
    id TEXT PRIMARY KEY NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL, category TEXT NOT NULL,
    keywords TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'seed'
  );
  CREATE TABLE IF NOT EXISTS gift_codes (
    code TEXT PRIMARY KEY NOT NULL, rewards TEXT NOT NULL, added_on TEXT NOT NULL, status TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'seed'
  );
  CREATE VIRTUAL TABLE IF NOT EXISTS heroes_fts USING fts5(id UNINDEXED, name, body, tokenize = 'unicode61 remove_diacritics 2');
  CREATE VIRTUAL TABLE IF NOT EXISTS sophia_fts USING fts5(id UNINDEXED, question, answer, keywords, tokenize = 'unicode61 remove_diacritics 2');
  CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(id UNINDEXED, name, body, tokenize = 'unicode61 remove_diacritics 2');
  `,
];
