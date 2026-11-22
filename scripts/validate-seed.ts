/* Validates seed integrity, runs the real migrations + seeder on SQLite, and exercises search + calculators. */
import assert from 'node:assert/strict';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as seed from '../src/data/seed';
import { migrations } from '../src/db/schema';
import { seedDatabase, upsertHeroes } from '../src/db/seed';
import { ftsQuery, fuzzyScore } from '../src/lib/fuzzy';
import { bagPoints, colExchange, phaseProgress, planCitadel, reKillPoints, simulateCasualties, bondExpBetween, bondGiftPlan, curioCost } from '../src/lib/calculators';
import { cycleForDate, nextUtcOccurrence, rotationWeek, weekIndex, msUntilUtcMidnight } from '../src/lib/time';
import { doubleDipPlan } from '../src/lib/planner';
import { eventsOn, todayThemes } from '../src/lib/schedule';
import { parseManifest } from '../src/db/ota-parse';
import { nodeDb } from './sqlite-adapter';

let checks = 0;
const ok = (cond: unknown, msg: string) => { assert.ok(cond, msg); checks++; };
const uniq = (xs: string[], what: string) => { const d = xs.filter((x, i) => xs.indexOf(x) !== i); ok(d.length === 0, `duplicate ${what}: ${d.join(', ')}`); };

// ---------- Referential integrity ----------
const heroIds = new Set(seed.heroes.map((h) => h.id));
const eventIds = new Set(seed.events.map((e) => e.id));
uniq(seed.heroes.map((h) => h.id), 'hero id');
uniq(seed.events.map((e) => e.id), 'event id');
uniq(seed.sophiaQuestions.map((q) => q.id), 'sophia id');
uniq(seed.giftCodes.map((c) => c.code), 'gift code');
ok(seed.events.length >= 47, `expected >= 47 events, got ${seed.events.length}`);
ok(seed.heroes.length >= 40, `expected >= 40 heroes, got ${seed.heroes.length}`);
for (const r of [2, 3, 4, 5, 6] as const) if (r >= 4) ok(seed.heroes.some((h) => h.rarity === r), `no ${r}-star hero`);
for (const e of seed.events) for (const h of e.featuredHeroes) ok(heroIds.has(h), `event ${e.id} features unknown hero ${h}`);
for (const g of seed.bondGroups) for (const m of g.members) ok(heroIds.has(m), `bond group ${g.id} has unknown member ${m}`);
for (const c of seed.curios) if (c.heroId) ok(heroIds.has(c.heroId), `curio ${c.id} unknown hero`);
for (const c of seed.eventCurrencies) ok(eventIds.has(c.eventId), `currency ${c.id} unknown event ${c.eventId}`);
for (const c of seed.cycleDays) ok(eventIds.has(c.eventId), `cycle days unknown event ${c.eventId}`);
for (const b of seed.bagItems) for (const k of Object.keys(b.points)) ok(k in seed.bagDayLabels, `bag item ${b.id} unknown day ${k}`);
ok(seed.citadelLevels.length === 40, 'citadel must have 40 levels');
ok(seed.gloryBuildings.length === 14, 'glory buildings must be 14');
ok(seed.shops.length === 12, 'shops must be 12');
ok(seed.bondLevels.length === 90 && seed.bondLevels[0]!.title === 'Stranger' && seed.bondLevels[80]!.title === 'Confidant', 'bond titles');
for (const e of seed.events) ok(/^\d{2}:\d{2}$/.test(e.startUtc), `event ${e.id} bad startUtc`);
const allSeedText = JSON.stringify(seed);
ok(!/\p{Extended_Pictographic}/u.test(allSeedText), 'seed data must not contain emoji');

// ---------- SQLite: real migrations + seeder + FTS ----------
(async () => {
  const db = nodeDb();
  for (const m of migrations) await db.execAsync(m);
  await seedDatabase(db as unknown as SQLiteDatabase);
  const n = (t: string) => (db.raw.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as { n: number }).n;
  ok(n('heroes') === seed.heroes.length, 'heroes seeded');
  ok(n('events') === seed.events.length, 'events seeded');
  ok(n('sophia') === seed.sophiaQuestions.length, 'sophia seeded');
  ok(n('heroes_fts') === seed.heroes.length, 'heroes fts seeded');

  // re-seed is idempotent
  await seedDatabase(db as unknown as SQLiteDatabase);
  ok(n('heroes_fts') === seed.heroes.length, 'reseed idempotent');

  const heroSearch = (q: string) => db.raw.prepare('SELECT name FROM heroes WHERE id IN (SELECT id FROM heroes_fts WHERE heroes_fts MATCH ?)').all(ftsQuery(q)!) as { name: string }[];
  ok(heroSearch('anast').some((r) => r.name === 'Anastasia'), 'prefix search anast');
  ok(heroSearch('astrology').length >= 4, 'source search astrology');
  ok(heroSearch('troop capacity').some((r) => r.name === 'Saya'), 'civil skill search');

  const sophia = (q: string) => db.raw.prepare('SELECT s.answer FROM sophia_fts f JOIN sophia s ON s.id = f.id WHERE sophia_fts MATCH ? ORDER BY bm25(sophia_fts, 0, 4, 1, 2) LIMIT 3').all(ftsQuery(q)!) as { answer: string }[];
  ok(sophia('hall of might hours')[0]?.answer === '8 consecutive hours', 'sophia hall of might');
  ok(sophia('infernal cooldown')[0]?.answer === '71 hours', 'sophia infernal');
  ok(sophia('fire advantage')[0]?.answer === 'Nature', 'sophia fire');
  ok(ftsQuery('"; DROP TABLE x; --') !== null && sophia('"; DROP TABLE x; --').length === 0, 'fts injection safe');
  ok(fuzzyScore('anastasa', 'Anastasia Frost Empress') >= 0.6, 'fuzzy typo');

  // OTA rows survive a reseed
  await upsertHeroes(db as unknown as SQLiteDatabase, [{ ...seed.heroes[0]!, notes: 'OTA override' }], 'ota');
  db.raw.exec("UPDATE meta SET value = '0' WHERE key = 'seed_version'");
  await seedDatabase(db as unknown as SQLiteDatabase);
  const kept = db.raw.prepare('SELECT data FROM heroes WHERE id = ?').get(seed.heroes[0]!.id) as { data: string };
  ok(JSON.parse(kept.data).notes === 'OTA override', 'OTA row preserved over reseed');

  // ---------- OTA manifest parsing ----------
  const m = parseManifest({ version: 3, packs: { heroes: [seed.heroes[1], { bogus: true }], giftCodes: [{ code: 'NEW1', rewards: 'x', addedOn: '2026-01-01', status: 'active' }], sophia: [{ id: 'z', question: 'q', answer: 'a' }] } });
  ok(m.packs.heroes!.length === 1 && m.packs.giftCodes!.length === 1 && m.packs.sophia![0]!.keywords.length === 0, 'manifest filters invalid rows');
  assert.throws(() => parseManifest({ packs: {} }));

  // ---------- Calculators ----------
  const bag = bagPoints(seed.bagItems, { omni5: 10, omni4: 5, bond5: 2 }, 'AL1');
  ok(bag.total === 10 * 10000 + 5 * 3000 + 2 * 5000, `bag total ${bag.total}`);
  ok(phaseProgress(600000, seed.aceLordPhases).reached.length === 6, 'phase 6 reached at 600k');
  ok(colExchange(12000, 10, 'lost').powerNeeded === 30_000_000, 'CoL 12k lost = 30M power');
  ok(colExchange(100, 1, 'killed').powerNeeded === 1_000_000, 'CoL 100 killed = 1M power');
  ok(reKillPoints([10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]) === 10 + 180, 'RE points');
  const cas = simulateCasualties({ incoming: 300000, medicalTentCap: 100000, medicalTentUsed: 0, sanctuaryCap: 50000, sanctuaryUsed: 0, allianceHospitalCap: 100000, permadeathRate: 0 });
  ok(cas.medicalTent === 100000 && cas.sanctuary === 50000 && cas.allianceHospital === 100000 && cas.dead === 50000, 'casualty cascade');
  const cas30 = simulateCasualties({ incoming: 100, medicalTentCap: 1000, medicalTentUsed: 0, sanctuaryCap: 0, sanctuaryUsed: 0, allianceHospitalCap: 0, permadeathRate: 0.3 });
  ok(cas30.dead === 30 && cas30.medicalTent === 70, 'CoL 30% permadeath');
  const plan = planCitadel(seed.citadelLevels, 10, 12, { food: 1e12 }, { civilSpeedPct: 0, builderGearPct: 0, vipPct: 0, institutePct: 100, costReductionPct: 0 });
  ok(plan.levels.length === 2 && plan.deficit.food === 0 && plan.deficit.wood > 0 && Math.abs(plan.netSeconds - plan.baseSeconds / 2) < 1e-6, 'citadel plan');
  ok(bondExpBetween(seed.bondLevels, 1, 2) === 100, 'bond exp L1');
  ok(bondGiftPlan(seed.bondGifts, { 5: 1, 1: 100 }, 5050).shortfall === 0, 'bond gift plan');
  ok(curioCost(seed.curioStarCosts, 0, 2).spinel === 30, 'curio cost');

  // ---------- Time & schedule ----------
  const mon = new Date(Date.UTC(2026, 10, 23, 12));
  const anchor = weekIndex(mon);
  ok(cycleForDate(mon, anchor) === 'Ace Lord' && cycleForDate(new Date(mon.getTime() + 7 * 864e5), anchor) === 'Arms Race', 'cycle alternates');
  ok(rotationWeek(new Date(mon.getTime() + 21 * 864e5), anchor) === 4, 'rotation week 4');
  const nxt = nextUtcOccurrence(mon, 'Sat', '10:00');
  ok(nxt.toISOString() === '2026-11-28T10:00:00.000Z', `next Sat 10:00 ${nxt.toISOString()}`);
  ok(msUntilUtcMidnight(mon) === 12 * 3600_000, 'reset countdown');
  const a = { aceLordAnchorWeek: anchor, rotationAnchorWeek: anchor };
  const sat = new Date(Date.UTC(2026, 10, 28, 11));
  ok(eventsOn(seed.events, sat, a).some((e) => e.id === 'conquest-of-lords'), 'CoL on Ace Lord Saturday');
  ok(!eventsOn(seed.events, sat, a).some((e) => e.id === 'realm-expedition'), 'no RE on Ace Lord Saturday');
  ok(todayThemes(mon, a).map((t) => t.theme).join('|') === 'Hero Upgrade|Rune & Holystone', 'Monday themes');
  ok(doubleDipPlan().length === 7, 'double dip plan');

  console.log(`Seed validation passed: ${checks} checks · ${seed.heroes.length} heroes · ${seed.events.length} events · ${seed.sophiaQuestions.length} Sophia answers · ${seed.giftCodes.length} codes`);
})().catch((e) => { console.error(e); process.exit(1); });
