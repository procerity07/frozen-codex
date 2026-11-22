import type { SQLiteDatabase } from 'expo-sqlite';
import type { GameEvent, GiftCode, Hero, SophiaQuestion } from '@/types/game';
import { events, giftCodes, heroes, sophiaQuestions, SEED_VERSION } from '@/data/seed';

export function heroSearchBody(h: Hero): string {
  return [
    h.title, h.element, h.unitType, h.role, `${h.rarity} star`, h.sources.join(' '), h.bondGroups.join(' '),
    h.marchSkills.map((s) => `${s.name} ${s.description}`).join(' '),
    h.civilSkills.map((s) => `${s.name} ${s.description}`).join(' '),
    h.match3Skill.name, h.match3Skill.effects.join(' '), h.notes,
  ].join(' ');
}

export function eventSearchBody(e: GameEvent): string {
  return [e.category, e.cadence, e.cycleWeek, e.summary, e.rules.join(' '), e.rewards.join(' '), e.currencies.join(' ')].join(' ');
}

export async function upsertHeroes(db: SQLiteDatabase, rows: Hero[], source: 'seed' | 'ota') {
  for (const h of rows) {
    await db.runAsync(
      'INSERT OR REPLACE INTO heroes (id, name, element, rarity, unit_type, data, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
      h.id, h.name, h.element, h.rarity, h.unitType, JSON.stringify(h), source,
    );
    await db.runAsync('DELETE FROM heroes_fts WHERE id = ?', h.id);
    await db.runAsync('INSERT INTO heroes_fts (id, name, body) VALUES (?, ?, ?)', h.id, h.name, heroSearchBody(h));
  }
}

export async function upsertEvents(db: SQLiteDatabase, rows: GameEvent[], source: 'seed' | 'ota') {
  for (const e of rows) {
    await db.runAsync(
      'INSERT OR REPLACE INTO events (id, name, category, cycle_week, data, source) VALUES (?, ?, ?, ?, ?, ?)',
      e.id, e.name, e.category, e.cycleWeek, JSON.stringify(e), source,
    );
    await db.runAsync('DELETE FROM events_fts WHERE id = ?', e.id);
    await db.runAsync('INSERT INTO events_fts (id, name, body) VALUES (?, ?, ?)', e.id, e.name, eventSearchBody(e));
  }
}

export async function upsertSophia(db: SQLiteDatabase, rows: SophiaQuestion[], source: 'seed' | 'ota') {
  for (const q of rows) {
    const kw = q.keywords.join(' ');
    await db.runAsync(
      'INSERT OR REPLACE INTO sophia (id, question, answer, category, keywords, source) VALUES (?, ?, ?, ?, ?, ?)',
      q.id, q.question, q.answer, q.category, kw, source,
    );
    await db.runAsync('DELETE FROM sophia_fts WHERE id = ?', q.id);
    await db.runAsync('INSERT INTO sophia_fts (id, question, answer, keywords) VALUES (?, ?, ?, ?)', q.id, q.question, q.answer, kw);
  }
}

export async function upsertGiftCodes(db: SQLiteDatabase, rows: GiftCode[], source: 'seed' | 'ota') {
  for (const c of rows) {
    await db.runAsync(
      `INSERT INTO gift_codes (code, rewards, added_on, status, source) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET rewards = excluded.rewards, status = excluded.status`,
      c.code.trim().toUpperCase(), c.rewards, c.addedOn, c.status, source,
    );
  }
}

/** Seeds bundled data when the stored seed version is older than SEED_VERSION. OTA rows are preserved. */
export async function seedDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'seed_version'");
  const stored = row ? Number(row.value) : 0;
  if (stored >= SEED_VERSION) return;
  await db.withTransactionAsync(async () => {
    const otaHeroes = new Set((await db.getAllAsync<{ id: string }>("SELECT id FROM heroes WHERE source = 'ota'")).map((r) => r.id));
    const otaEvents = new Set((await db.getAllAsync<{ id: string }>("SELECT id FROM events WHERE source = 'ota'")).map((r) => r.id));
    await upsertHeroes(db, heroes.filter((h) => !otaHeroes.has(h.id)), 'seed');
    await upsertEvents(db, events.filter((e) => !otaEvents.has(e.id)), 'seed');
    await upsertSophia(db, sophiaQuestions, 'seed');
    await upsertGiftCodes(db, giftCodes, 'seed');
    await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', ?)", String(SEED_VERSION));
  });
}
