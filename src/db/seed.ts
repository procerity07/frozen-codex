import type { SQLiteDatabase } from 'expo-sqlite';
import type { GameEvent, GiftCode, Hero, SophiaQuestion } from '@/types/game';
import { events, giftCodes, heroes, sophiaQuestions, SEED_VERSION } from '@/data/seed';
import { heroRevision, normalizeHero } from '@/lib/heroData';

export function heroSearchBody(h: Hero): string {
  return [
    h.title, h.element, h.unitType, h.role, `${h.rarity} star`, h.sources.join(' '), h.bondGroups.join(' '),
    h.marchSkills.map((s) => `${s.name} ${s.description}`).join(' '),
    h.civilSkills.map((s) => `${s.name} ${s.description}`).join(' '),
    h.match3Skill?.name ?? '', h.match3Skill?.effects.join(' ') ?? '', h.notes,
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

function storedRevision(data: string): number {
  try {
    return heroRevision(normalizeHero(JSON.parse(data) as Hero));
  } catch {
    return 0;
  }
}

/**
 * Bundled heroes for (re-)seeding. A row that came from an online pack is kept unless the bundled
 * record has a strictly newer revision — so corrected bundled data replaces stale pack rows, while a
 * pack published at the same or a newer revision keeps precedence.
 */
export async function bundledHeroesToSeed(db: SQLiteDatabase, bundled: Hero[] = heroes): Promise<Hero[]> {
  const ota = await db.getAllAsync<{ id: string; data: string }>("SELECT id, data FROM heroes WHERE source = 'ota'");
  const otaRev = new Map(ota.map((r) => [r.id, storedRevision(r.data)]));
  return bundled.filter((h) => !otaRev.has(h.id) || heroRevision(h) > otaRev.get(h.id)!);
}

/**
 * Applies online-pack heroes. A pack row is skipped when the stored row (bundled or online) has a
 * newer revision, so an older pack cannot silently overwrite corrected data. Returns skipped ids.
 */
export async function mergePackHeroes(db: SQLiteDatabase, rows: Hero[]): Promise<{ applied: number; skipped: string[] }> {
  const stored = await db.getAllAsync<{ id: string; data: string }>('SELECT id, data FROM heroes');
  const rev = new Map(stored.map((r) => [r.id, storedRevision(r.data)]));
  const accept: Hero[] = [];
  const skipped: string[] = [];
  for (const raw of rows) {
    const h = normalizeHero(raw);
    if (rev.has(h.id) && heroRevision(h) < rev.get(h.id)!) skipped.push(h.id);
    else accept.push(h);
  }
  await upsertHeroes(db, accept, 'ota');
  return { applied: accept.length, skipped };
}

const eventRevision = (e: Pick<GameEvent, 'revision'>): number =>
  typeof e.revision === 'number' && Number.isFinite(e.revision) && e.revision >= 0 ? e.revision : 0;

function storedEventRevision(data: string): number {
  try {
    return eventRevision(JSON.parse(data) as GameEvent);
  } catch {
    return 0;
  }
}

/** Bundled events for (re-)seeding: same rule as heroes — replace an online row only with a strictly newer revision. */
export async function bundledEventsToSeed(db: SQLiteDatabase, bundled: GameEvent[] = events): Promise<GameEvent[]> {
  const ota = await db.getAllAsync<{ id: string; data: string }>("SELECT id, data FROM events WHERE source = 'ota'");
  const otaRev = new Map(ota.map((r) => [r.id, storedEventRevision(r.data)]));
  return bundled.filter((e) => !otaRev.has(e.id) || eventRevision(e) > otaRev.get(e.id)!);
}

/** Applies online-pack events, skipping any whose stored row has a newer revision. Returns skipped ids. */
export async function mergePackEvents(db: SQLiteDatabase, rows: GameEvent[]): Promise<{ applied: number; skipped: string[] }> {
  const stored = await db.getAllAsync<{ id: string; data: string }>('SELECT id, data FROM events');
  const rev = new Map(stored.map((r) => [r.id, storedEventRevision(r.data)]));
  const accept: GameEvent[] = [];
  const skipped: string[] = [];
  for (const e of rows) {
    if (rev.has(e.id) && eventRevision(e) < rev.get(e.id)!) skipped.push(e.id);
    else accept.push(e);
  }
  await upsertEvents(db, accept, 'ota');
  return { applied: accept.length, skipped };
}

/** Seeds bundled data when the stored seed version is older than SEED_VERSION. OTA rows are preserved unless superseded (see bundledHeroesToSeed). */
export async function seedDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'seed_version'");
  const stored = row ? Number(row.value) : 0;
  if (stored >= SEED_VERSION) return;
  await db.withTransactionAsync(async () => {
    await upsertHeroes(db, await bundledHeroesToSeed(db), 'seed');
    await upsertEvents(db, await bundledEventsToSeed(db), 'seed');
    await upsertSophia(db, sophiaQuestions, 'seed');
    await upsertGiftCodes(db, giftCodes, 'seed');
    await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', ?)", String(SEED_VERSION));
  });
}
