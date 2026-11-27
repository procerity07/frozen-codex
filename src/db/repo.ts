import type { Element, GameEvent, GiftCode, Hero, Rarity, SophiaQuestion, UnitType } from '@/types/game';
import { ftsQuery, fuzzyScore } from '@/lib/fuzzy';
import { normalizeHero } from '@/lib/heroData';
import { getDb, IS_WEB } from './client';

const like = (q: string) => `%${q.trim().replace(/[%_]/g, '')}%`;

export interface HeroFilter {
  query?: string;
  elements?: Element[];
  rarities?: Rarity[];
  unitTypes?: UnitType[];
}

const parse = <T,>(rows: { data: string }[]): T[] => rows.map((r) => JSON.parse(r.data) as T);

export async function listHeroes(filter: HeroFilter = {}): Promise<Hero[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.elements?.length) { where.push(`element IN (${filter.elements.map(() => '?').join(',')})`); params.push(...filter.elements); }
  if (filter.rarities?.length) { where.push(`rarity IN (${filter.rarities.map(() => '?').join(',')})`); params.push(...filter.rarities); }
  if (filter.unitTypes?.length) { where.push(`unit_type IN (${filter.unitTypes.map(() => '?').join(',')})`); params.push(...filter.unitTypes); }
  const match = filter.query ? ftsQuery(filter.query) : null;
  if (match && IS_WEB) { where.push("id IN (SELECT id FROM heroes_fts WHERE name || ' ' || body LIKE ?)"); params.push(like(filter.query!)); }
  else if (match) { where.push('id IN (SELECT id FROM heroes_fts WHERE heroes_fts MATCH ?)'); params.push(match); }
  const sql = `SELECT data FROM heroes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY rarity DESC, name ASC`;
  const rows = parse<Hero>(await db.getAllAsync<{ data: string }>(sql, params)).map(normalizeHero);
  if (rows.length || !filter.query) return rows;
  // Typo-tolerant fallback
  const all = await listHeroes({ ...filter, query: undefined });
  return all
    .map((h) => ({ h, s: fuzzyScore(filter.query!, `${h.name} ${h.title} ${h.role}`) }))
    .filter((x) => x.s >= 0.6)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.h);
}

export async function getHero(id: string): Promise<Hero | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM heroes WHERE id = ?', id);
  return row ? normalizeHero(JSON.parse(row.data) as Hero) : null;
}

export async function listEvents(query?: string): Promise<GameEvent[]> {
  const db = await getDb();
  const match = query ? ftsQuery(query) : null;
  const rows = match && IS_WEB
    ? await db.getAllAsync<{ data: string }>("SELECT data FROM events WHERE id IN (SELECT id FROM events_fts WHERE name || ' ' || body LIKE ?) ORDER BY rowid", like(query!))
    : match
    ? await db.getAllAsync<{ data: string }>('SELECT data FROM events WHERE id IN (SELECT id FROM events_fts WHERE events_fts MATCH ?) ORDER BY rowid', match)
    : await db.getAllAsync<{ data: string }>('SELECT data FROM events ORDER BY rowid');
  return parse<GameEvent>(rows);
}

export async function getEvent(id: string): Promise<GameEvent | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM events WHERE id = ?', id);
  return row ? (JSON.parse(row.data) as GameEvent) : null;
}

interface SophiaRow { id: string; question: string; answer: string; category: string; keywords: string }
const toSophia = (r: SophiaRow): SophiaQuestion => ({
  id: r.id, question: r.question, answer: r.answer, category: r.category as SophiaQuestion['category'], keywords: r.keywords.split(' ').filter(Boolean),
});

/** FTS ranked search with fuzzy fallback; returns at most `limit` rows. */
export async function searchSophia(query: string, limit = 25): Promise<SophiaQuestion[]> {
  const db = await getDb();
  const match = ftsQuery(query);
  if (!match) {
    return (await db.getAllAsync<SophiaRow>('SELECT * FROM sophia ORDER BY category, id LIMIT ?', limit)).map(toSophia);
  }
  const ranked = IS_WEB ? await db.getAllAsync<SophiaRow>(
    "SELECT * FROM sophia WHERE question || ' ' || keywords || ' ' || answer LIKE ? LIMIT ?", like(query), limit,
  ) : await db.getAllAsync<SophiaRow>(
    `SELECT s.* FROM sophia_fts f JOIN sophia s ON s.id = f.id WHERE sophia_fts MATCH ? ORDER BY bm25(sophia_fts, 0, 4, 1, 2) LIMIT ?`,
    match, limit,
  );
  if (ranked.length) return ranked.map(toSophia);
  const all = await db.getAllAsync<SophiaRow>('SELECT * FROM sophia');
  return all
    .map((r) => ({ r, s: fuzzyScore(query, `${r.question} ${r.keywords} ${r.answer}`) }))
    .filter((x) => x.s >= 0.55)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => toSophia(x.r));
}

export async function countSophia(): Promise<number> {
  const db = await getDb();
  return (await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sophia'))?.n ?? 0;
}

export async function listGiftCodes(): Promise<GiftCode[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ code: string; rewards: string; added_on: string; status: string; source: string }>(
    'SELECT * FROM gift_codes ORDER BY added_on DESC',
  );
  return rows.map((r) => ({ code: r.code, rewards: r.rewards, addedOn: r.added_on, status: r.status as GiftCode['status'], userAdded: r.source === 'user' }));
}

export async function addGiftCode(code: string, rewards: string): Promise<void> {
  const db = await getDb();
  const clean = code.replace(/\s+/g, '').toUpperCase();
  if (!clean) return;
  await db.runAsync(
    'INSERT OR IGNORE INTO gift_codes (code, rewards, added_on, status, source) VALUES (?, ?, ?, ?, ?)',
    clean, rewards || 'User added', new Date().toISOString().slice(0, 10), 'active', 'user',
  );
}

export async function removeGiftCode(code: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM gift_codes WHERE code = ? AND source = 'user'", code);
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  return (await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key))?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
}

export async function dbStats(): Promise<{ heroes: number; events: number; sophia: number; codes: number }> {
  const db = await getDb();
  const n = async (t: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${t}`))?.n ?? 0;
  return { heroes: await n('heroes'), events: await n('events'), sophia: await n('sophia'), codes: await n('gift_codes') };
}
