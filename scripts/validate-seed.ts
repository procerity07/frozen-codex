import { affordable, trainingCost } from '../src/lib/training';
import { formatDuration as fmtDur } from '../src/lib/time';
import { skillsCheckedInGame } from '../src/lib/heroData';
import { normalizeLegend, outpostAreas } from '../src/lib/hive';
import { packContent } from './pack-content';
import { readFileSync as readPackFile } from 'node:fs';
import { cycleForDate as tCycle, rotationWeek as tRotation, weekIndex as tWeekIndex } from '../src/lib/time';
import { anchorFor, cleanAllianceTime, timeForWeek, upcomingStarts } from '../src/lib/allianceTimes';
import { coordsOf, exportCode, importCode, migrateHive, newHive, parseMembers, pieceAt, putPiece, resize, unplaced } from '../src/lib/hive';
import { nextOccurrence, weeklyTriggers, normalizeTime, describeDays } from '../src/lib/reminders';
/* Validates seed integrity, runs the real migrations + seeder on SQLite, and exercises search + calculators. */
import assert from 'node:assert/strict';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as seed from '../src/data/seed';
import { migrations } from '../src/db/schema';
import { bundledEventsToSeed, bundledHeroesToSeed, mergePackEvents, mergePackHeroes, seedDatabase, upsertEvents, upsertHeroes } from '../src/db/seed';
import { combatRoleLabel, normalizeHero } from '../src/lib/heroData';
import { reKillPointsByTier } from '../src/lib/calculators';
import { compareVersions, isNewer, notesToBlocks, parseRelease } from '../src/lib/appUpdate';
import { chunk, parsePortraitResponse, portraitQueryUrl } from '../src/lib/portraits';
import { bondCapForEnhancement, civilBonuses, clampEntry, makeRosterFile, maxStars, newEntry, parseRosterFile, promotionStatus, requiredEnhancementForBond, shardsBetween, specialtyUnlocked, unlockLevelOf } from '../src/lib/roster';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Hero } from '../src/types/game';
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
ok(seed.shops.length === 13, 'shops must be 13');
for (const s of seed.shops) ok(new Set(s.items.map((x) => x.name)).size === s.items.length, `${s.id}: item names must be unique`);
ok(seed.bondLevels.length === 95 && seed.bondLevels[0]!.expToNext === 1000 && seed.bondLevels[94]!.expToNext === 330000 && seed.bondLevels[0]!.title === 'Stranger' && seed.bondLevels[79]!.title === 'Confidant', 'bond levels match wiki endpoints');
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
    ok(sophia('hall of might scramble')[0]?.answer === '6 hours', 'sophia in-game scramble question');
  ok(sophia('polar bear skin')[0]?.answer === 'Black', 'sophia in-game general question');
  ok(sophia('deluxe recruit 5')[0]?.answer === '25%', 'sophia probabilities shown as percentages');
  ok(sophia('instant output cooldown')[0]?.answer === '12 hours', 'sophia instant output');
  ok(sophia('fire counter')[0]?.answer === 'Nature', 'sophia fire');
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
  ok(bag.total === 10 * 30000 + 5 * 10000 + 2 * 18750, `bag total ${bag.total}`);
  ok(seed.aceLordPhases.map((p) => p.points).join() === '15000,30000,60000,120000,300000,600000', 'Ace Lord Day 1 phases match in-game');
  ok(seed.bagItems.filter((i) => i.points.AL1).every((i) => i.verifiedDays?.includes('AL1')), 'all Ace Lord Day 1 bag values confirmed in-game');
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
  ok(plan.unknownTimeLevels.join() === '11' && plan.baseSeconds === ((1 * 24 + 8) * 60 + 31) * 60 + 30, 'unknown build time excluded from totals');
  const c12 = seed.citadelLevels.find((l) => l.level === 12)!;
  ok(c12.cost.food === 1_140_000 && c12.cost.stone === 25_400 && c12.baseSeconds === ((1 * 24 + 8) * 60 + 31) * 60 + 30, 'citadel 12 values');
  ok(seed.citadelLevels.find((l) => l.level === 40)!.cost.iron === 28_801_000 && seed.citadelLevels.find((l) => l.level === 40)!.cost.goldStatue === 10_400, 'citadel 40 iron and Gold Statues (wiki)');
  ok(seed.citadelLevels.every((l, i) => l.level === i + 1), 'citadel levels ordered 1-40');
  ok(bondExpBetween(seed.bondLevels, 1, 2) === 1000, 'bond exp L1');
  ok(bondGiftPlan(seed.bondGifts, { 5: 1, 1: 100 }, 5050).shortfall === 0, 'bond gift plan');
  ok(curioCost(seed.curioStarCosts, 4, 6).spinel === 2500 && curioCost(seed.curioStarCosts, 4, 6).crystal === 100, 'curio cost');

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
  ok(todayThemes(mon, a).map((t) => t.theme).join('|') === 'Heroes Assemble (Hero Upgrade)', 'Monday themes (no Alliance Duel)');
  ok(todayThemes(new Date(mon.getTime() + 86_400_000), a).map((t) => t.theme).join('|') === 'Path to Development (Build & Research)|Curio', 'Tuesday shows Curio as the daily event');
  ok(!eventsOn(seed.events, mon, a).some((e) => e.id === 'alliance-duel'), 'Alliance Duel not scheduled');
  ok(doubleDipPlan().length === 7, 'double dip plan');


  // ---------- Hero audit: combat role, older records, revision precedence ----------
  const byId = (id: string) => seed.heroes.find((h) => h.id === id)!;
  ok(seed.heroes.every((h) => h.audit && h.audit.sourceUrls.length > 0 && h.audit.sourceUrls.every((u) => u.startsWith('https://'))), 'every hero has an audit trail with https sources');
  ok(seed.heroes.every((h) => h.revision === seed.HERO_DATA_REVISION), 'bundled heroes carry the data revision');
  ok(seed.heroes.every((h) => !h.audit!.verified.includes('combatRole') || h.combatRole !== undefined), 'combatRole only marked verified when set');
  ok(byId('tania').unitType === 'Cavalry', 'user correction preserved: Tania is Cavalry');
  ok(byId('tania').role === 'Cavalry Support', 'user pack edit preserved: Tania role text');
  ok(byId('anastasia').element === 'Fire' && byId('khaos').unitType === 'Civil' && byId('khaos').rarity === 5, 'audited corrections present');

  const rdb = nodeDb();
  for (const m of migrations) await rdb.execAsync(m);
  await seedDatabase(rdb as unknown as SQLiteDatabase);
  const readHero = (id: string) => normalizeHero(JSON.parse((rdb.raw.prepare('SELECT data FROM heroes WHERE id = ?').get(id) as { data: string }).data) as Hero);

  // (a) A hero with verified role data survives save + load.
  const withRole: Hero = { ...byId('edith'), combatRole: 'Support' };
  await upsertHeroes(rdb as unknown as SQLiteDatabase, [withRole], 'seed');
  ok(readHero('edith').combatRole === 'Support' && combatRoleLabel(readHero('edith')) === 'Support', 'combat role round-trips through SQLite');

  // (b) An older record (hosted pack v2: no combatRole / audit / revision) loads and falls back safely.
  // Frozen copy of the hosted v2 pack (before the audit), used as real "older online data".
  const packPath = join(__dirname, 'fixtures', 'manifest-v2.json');
  const oldPack = parseManifest(JSON.parse(readFileSync(packPath, 'utf8')));
  const oldKhaos = oldPack.packs.heroes!.find((h) => h.id === 'khaos')!;
  ok(oldKhaos.combatRole === undefined && oldKhaos.audit === undefined && oldKhaos.revision === undefined, 'hosted v2 pack hero has no new fields');
  const odb = nodeDb();
  for (const m of migrations) await odb.execAsync(m);
  await upsertHeroes(odb as unknown as SQLiteDatabase, [oldKhaos], 'ota');
  const loadedOld = normalizeHero(JSON.parse((odb.raw.prepare('SELECT data FROM heroes WHERE id = ?').get('khaos') as { data: string }).data) as Hero);
  ok(loadedOld.name === 'Khaos' && combatRoleLabel(loadedOld) === 'Not verified', 'older record loads with "Not verified" fallback');

  // (c) Invalid role values from a pack are dropped, not rendered.
  const bad = parseManifest({ version: 9, packs: { heroes: [{ ...byId('eric'), combatRole: 'Tank', audit: { checkedOn: 1 } }] } });
  ok(bad.packs.heroes![0]!.combatRole === undefined && bad.packs.heroes![0]!.audit === undefined, 'invalid combatRole/audit from pack dropped');

  // (d) A stale online pack cannot overwrite corrected bundled heroes.
  const merged = await mergePackHeroes(rdb as unknown as SQLiteDatabase, oldPack.packs.heroes!);
  ok(merged.applied === 0 && merged.skipped.length === oldPack.packs.heroes!.length, `stale v2 pack skipped (${merged.skipped.length} heroes)`);
  ok(readHero('khaos').unitType === 'Civil' && readHero('tania').element === 'Ice', 'corrections kept after stale pack');

  // (e) Existing install that already synced the v2 pack: re-seed replaces those rows with corrected data.
  const xdb = nodeDb();
  for (const m of migrations) await xdb.execAsync(m);
  await upsertHeroes(xdb as unknown as SQLiteDatabase, oldPack.packs.heroes!, 'ota');
  xdb.raw.exec("INSERT INTO meta (key, value) VALUES ('seed_version', '3')");
  ok((await bundledHeroesToSeed(xdb as unknown as SQLiteDatabase)).length === seed.heroes.length, 'all stale pack heroes superseded by bundled revision');
  await seedDatabase(xdb as unknown as SQLiteDatabase);
  const xk = JSON.parse((xdb.raw.prepare("SELECT data, source FROM heroes WHERE id = 'khaos'").get() as { data: string }).data) as Hero;
  ok(xk.unitType === 'Civil' && xk.revision === seed.HERO_DATA_REVISION, 'existing install receives corrected Khaos on re-seed');
  ok((xdb.raw.prepare("SELECT COUNT(*) n FROM heroes_fts WHERE id = 'khaos'").get() as { n: number }).n === 1, 'FTS row replaced, not duplicated');

  // (f) A future pack at the same or newer revision still applies.
  const newer = await mergePackHeroes(rdb as unknown as SQLiteDatabase, [{ ...byId('eric'), revision: seed.HERO_DATA_REVISION + 1, notes: 'pack v4 note' }]);
  ok(newer.applied === 1 && readHero('eric').notes === 'pack v4 note', 'newer-revision pack row applies');


  // ---------- Round 2: tiers removed, 2–4★ roster, wiki corrections ----------
  ok(seed.heroes.every((h) => !('tiers' in h)), 'no bundled hero carries tier ratings');
  const tieredOld = oldPack.packs.heroes!.find((h) => h.id === 'tania')! as Hero & { tiers?: unknown };
  ok(tieredOld.tiers === undefined, 'tiers stripped from older pack records on import');
  ok(!('tiers' in normalizeHero({ ...byId('eric'), tiers: { pve: 'S' } } as Hero)), 'tiers stripped from stored records on load');
  const LOW = ['baron', 'lucia', 'tulios', 'capos', 'tooka', 'sophia', 'ada', 'axel', 'andre', 'odell', 'viola', 'luke', 'gerolin', 'roger',
    'cassandra', 'dolly', 'wallace', 'schubert', 'ysera', 'penny', 'aemon', 'hannah', 'christina', 'hanzo', 'claudia', 'william', 'chloe', 'elsa', 'gina'];
  ok(LOW.every((id) => seed.heroes.some((h) => h.id === id && h.rarity <= 4)), 'all wiki 2–4★ heroes present');
  ok(seed.heroes.filter((h) => h.rarity <= 4).length === LOW.length, `2–4★ count = ${LOW.length}`);
  ok(seed.heroes.filter((h) => h.rarity <= 4).every((h) => h.audit && h.audit.sourceUrls.length >= 2 && h.combatRole === undefined), 'new heroes sourced; no invented roles');
  ok(seed.heroes.every((h) => h.match3Skill === undefined || typeof h.match3Skill.name === 'string'), 'match-3 optional and well-formed');
  ok(JSON.stringify(reKillPointsByTier) === JSON.stringify([0, 1, 2, 4, 6, 12, 18, 25, 30, 45, 80, 100]), 'RE kill points match wiki');
  ok(seed.royalArmsRace.every((r) => r.themes.length >= 5) && seed.events.find((e) => e.id === 'royal-arms-race')!.days.join() === 'Thu,Fri,Sat,Sun', 'Royal Arms Race Thu–Sun with theme sets');
  ok(seed.gloryBuildings.find((g) => g.building === 'Institute')!.stat === 'Infantry DEF' && seed.gloryBuildings.find((g) => g.building === 'Embassy')!.stat === 'Archer HP', 'Glory mapping matches wiki');
  ok(seed.totemSets.map((t) => t.forgeLevel).join() === '16,20,22,30,31', 'Totem set unlock levels');
  ok(seed.runeSets.length === 4, 'four rune types');
  ok(seed.bondGifts.map((g) => g.exp).join() === '100,500,1000,5000,10000', 'bond gift EXP');
  ok(seed.aceLordPhases[0]!.points === 15000 && seed.aceLordPhases[5]!.points === 600000, 'Ace Lord phase endpoints');
  ok(seed.events.every((e) => e.revision === seed.EVENT_DATA_REVISION), 'bundled events carry revision');

  // Stale v2 pack cannot overwrite corrected events; existing installs get corrected events on re-seed.
  const stale = await mergePackEvents(rdb as unknown as SQLiteDatabase, oldPack.packs.events!);
  ok(stale.applied === 0 && stale.skipped.length === oldPack.packs.events!.length, `stale v2 events skipped (${stale.skipped.length})`);
  const edb = nodeDb();
  for (const m of migrations) await edb.execAsync(m);
  await upsertEvents(edb as unknown as SQLiteDatabase, oldPack.packs.events!, 'ota');
  edb.raw.exec("INSERT INTO meta (key, value) VALUES ('seed_version', '3')");
  ok((await bundledEventsToSeed(edb as unknown as SQLiteDatabase)).length === seed.events.length, 'stale pack events superseded on re-seed');
  await seedDatabase(edb as unknown as SQLiteDatabase);
  const rar = JSON.parse((edb.raw.prepare("SELECT data FROM events WHERE id = 'royal-arms-race'").get() as { data: string }).data);
  ok(rar.days.join() === 'Thu,Fri,Sat,Sun', 'existing install receives corrected Royal Arms Race');

  // The published pack must parse and agree with the bundled data revisions.
  const livePack = parseManifest(JSON.parse(readFileSync(join(__dirname, '..', 'data-pack', 'manifest.json'), 'utf8')));
  ok(livePack.version >= 3 && livePack.packs.heroes!.every((h) => seed.heroes.some((b) => b.id === h.id) && (h.revision ?? 0) <= seed.HERO_DATA_REVISION), 'published pack heroes exist in the app and are never newer');
  ok(seed.upgradeTable('gear')[39]!.essence === 210_000 && seed.upgradeTable('gear').length === 40, 'user gear table kept');
  ok(seed.upgradeTable('holystone').length === 40 && seed.upgradeTable('holystone')[29]!.arcaneCore === 1, 'holystone curve unchanged');

  // In-game Event Schedule, week of Mon 23 Nov 2026 (Ace Lord week, rotation week 3).
  const wk = new Date(Date.UTC(2026, 10, 23, 12));
  const wa = { aceLordAnchorWeek: weekIndex(wk), rotationAnchorWeek: weekIndex(wk) - 2 };
  const on = (day: number, id: string) => eventsOn(seed.events, new Date(Date.UTC(2026, 10, day, 12)), wa).some((e) => e.id === id);
  ok(on(23, 'scorching-front') && on(23, 'wonder-house') && on(23, 'shadow-expedition') && on(23, 'alliance-trial') && on(23, 'sophias-test'), 'Monday 23 Nov matches in-game');
  ok(on(25, 'oblivion-war') && on(26, 'royal-arms-race') && !on(24, 'timeless-heroes-limited-recruitment'), 'mid-week events match in-game');
  ok(on(23, 'resource-supply') && on(29, 'holystone-upgrades'), 'new week-long events present');
  ok(on(24, 'alliance-party') && on(27, 'alliance-party') && !on(25, 'alliance-party'), 'Alliance Party Tue and Fri');
  ok(on(24, 'undead-scourge') && on(26, 'undead-scourge') && !on(25, 'undead-scourge'), 'Undead Scourge Tue and Thu');
  ok(on(26, 'elemental-seal-i-ii-iii') && on(27, 'elemental-seal-i-ii-iii') && on(26, 'sophias-test'), 'Elemental Seal and Sophia Thursday');

  // ---------- App update check ----------
  ok(isNewer('v1.0.10', '1.0.9') && isNewer('1.1.0', '1.0.99') && !isNewer('V1.0.3', '1.0.3') && compareVersions('1.0.4', 'v1.0.5') < 0, 'version comparison');
  ok(!isNewer('garbage', '1.0.0') && isNewer('1.0.1', 'garbage'), 'unparseable versions sort lowest');
  const relRaw = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'release-latest.json'), 'utf8'));
  const rel = parseRelease(relRaw, 'procerity07/frozen-codex');
  ok(rel !== null && rel.apkUrl.endsWith('.apk') && rel.apkUrl.startsWith('https://github.com/procerity07/frozen-codex/'), 'real release parses with APK link');
  ok(parseRelease({ ...relRaw, assets: [{ browser_download_url: 'https://evil.example/x.apk' }] }, 'procerity07/frozen-codex') === null, 'foreign download links rejected');
  ok(parseRelease({ ...relRaw, draft: true }, 'procerity07/frozen-codex') === null, 'draft releases ignored');
  const blocks = notesToBlocks(rel!.notes);
  ok(blocks.some((b) => b.kind === 'heading') && blocks.some((b) => b.kind === 'bullet') && !blocks.some((b) => /^Install:|^Built from|^## /.test(b.text)), 'release notes render as headings and bullets');

  // ---------- My Heroes roster (wiki progression rules) ----------
  const saya = byId('saya'); const gina = byId('gina'); const baron = byId('baron');
  ok(shardsBetween(0, 8) === 1040 && shardsBetween(-1, 8) === 1050 && shardsBetween(4, 5) === 75, 'enhancement shard costs (total 1,050)');
  ok(clampEntry(baron, { stars: 6, level: 999, enhancement: 8, bond: 200 }).stars === 2 && clampEntry(gina, { enhancement: 8 }).enhancement === 5, 'stars and below-5★ enhancement clamped');
  ok(clampEntry(saya, { stars: 5, level: 999 }).level === 310 && clampEntry(saya, { stars: 6, level: 999 }).level === 400 && maxStars(saya) === 6, 'level caps 310 / 400; 5★ can reach 6★');
  ok(clampEntry(saya, { level: Number.NaN, bond: -3 } as never).level === 1 && clampEntry(saya, undefined).bond === 1, 'bad saved values fall back safely');
  ok(promotionStatus(saya, { stars: 5, level: 310, enhancement: 5, bond: 1 }).eligible && !promotionStatus(saya, { stars: 5, level: 309, enhancement: 5, bond: 1 }).eligible && !promotionStatus(gina, newEntry(gina)).possible, 'promotion rule Lv. 310 + 5');
  ok(bondCapForEnhancement(0) === 5 && bondCapForEnhancement(5) === 55 && bondCapForEnhancement(7) === 86 && bondCapForEnhancement(8) === null && requiredEnhancementForBond(56) === 6, 'bond enhancement gates');
  ok(specialtyUnlocked({ stars: 6, level: 350, enhancement: 8, bond: 1 }) && !specialtyUnlocked({ stars: 6, level: 349, enhancement: 8, bond: 1 }), 'specialty at +8 and Lv. 350');
  const cb = civilBonuses(seed.heroes, { saya: { stars: 5, level: 131, enhancement: 8, bond: 1 }, gina: { stars: 4, level: 100, enhancement: 5, bond: 1 } });
  const sayaCap = cb.find((b) => b.heroId === 'saya' && b.skill === 'Troop Capacity')!;
  ok(sayaCap.active && sayaCap.value === 22500, 'Saya 5★ +8 troop capacity = +22,500');
  const ginaCap = cb.find((b) => b.heroId === 'gina' && b.skill === 'Troop Capacity')!;
  ok(!ginaCap.active && ginaCap.note === 'Unlocks at Lv. 131', 'locked skills reported below unlock level');
  ok(cb.find((b) => b.heroId === 'saya' && b.skill === 'Construction Speed')!.value === 75, '5★ +8 Saya construction speed = 75% (in-game)');
  ok(civilBonuses(seed.heroes, { saya: { stars: 5, level: 131, enhancement: 0, bond: 1 } }).find((b) => b.skill === 'Construction Speed')!.value === null, 'Saya Hero0 construction speed stays unverified (not shown in-game)');
  ok(cb.find((b) => b.heroId === 'gina' && b.skill === 'EXP Potion Output')!.value === 100, 'Gina 4★ +5 EXP Potion Output = 100% (in-game)');
  const saya6 = civilBonuses(seed.heroes, { saya: { stars: 6, level: 400, enhancement: 6, bond: 1 } }).find((b) => b.skill === 'Construction Speed')!;
  ok(saya6.value === 48 && saya6.unit === '%', 'Saya 6★ +6 construction speed = +48%');

  // Roster import/export
  const rf = parseRosterFile(JSON.parse(JSON.stringify(makeRosterFile({ tania: { stars: 5, level: 999, enhancement: 9, bond: 3 }, nobody: { stars: 5, level: 1, enhancement: 0, bond: 1 } }))), seed.heroes);
  ok(rf.entries.tania!.level === 310 && rf.entries.tania!.enhancement === 8 && rf.skipped.join() === 'nobody', 'roster import clamps values and skips unknown heroes');
  ok(Object.keys(parseRosterFile({ app: 'frozen-codex', profile: { roster: { saya: { stars: 5, level: 210, enhancement: 1, bond: 10 } } } }, seed.heroes).entries).join() === 'saya', 'roster import reads full backups');
  assert.throws(() => parseRosterFile({ hello: 1 }, seed.heroes));
  ok(['sodoma', 'setemos', 'tutanhet', 'sirona', 'isabella'].every((id) => seed.heroes.some((h) => h.id === id)) && byId('isabella').rarity === 6, 'five added heroes present');
  ok(JSON.stringify(byId('saya').civilSkills.find((c) => c.name === 'Troop Capacity')!.tiers!['6']) === JSON.stringify([null, null, null, null, null, 12500, 16000, 20000, 30000]), 'Saya 6★ troop capacity from in-game table');

  // Hero portraits (real wiki API response)
  const wiki = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'wiki-portraits.json'), 'utf8'));
  const pb = [{ id: 'tania', name: 'Tania' }, { id: 'snowball-and-ivy', name: 'Snowball & Ivy' }, { id: 'ysera', name: 'Ysera' }, { id: 'kujo-mamoru', name: 'Kujo Mamoru' }];
  const pm = parsePortraitResponse(wiki, pb);
  ok(!!pm.tania && !!pm['kujo-mamoru'] && pm.ysera === undefined, 'portraits found; hero without wiki image falls back');
  ok(Object.values(pm).every((u) => u.startsWith('https://static.wikia.nocookie.net/puzzles-chaos/')), 'portrait links stay on the wiki image host');
  const evil = JSON.parse(JSON.stringify(wiki));
  for (const pg of Object.values(evil.query.pages) as { thumbnail?: { source: string } }[]) if (pg.thumbnail) pg.thumbnail.source = 'https://evil.example/x.jpg';
  ok(Object.keys(parsePortraitResponse(evil, pb)).length === 0 && Object.keys(parsePortraitResponse(null, pb)).length === 0, 'foreign or broken responses rejected');
  ok(chunk(seed.heroes, 50).length === 2 && portraitQueryUrl(['Snowball & Ivy']).includes('Snowball%20%26%20Ivy'), 'portrait requests batched and encoded');

  console.log(`Seed validation passed: ${checks} checks · ${seed.heroes.length} heroes · ${seed.events.length} events · ${seed.sophiaQuestions.length} Sophia answers · ${seed.giftCodes.length} codes`);
})().catch((e) => { console.error(e); process.exit(1); });
// User reminders
{
  const base = { id: 't', title: 't', enabled: true } as const;
  const mon = new Date(Date.UTC(2026, 10, 23, 10, 0)); // Monday 10:00 UTC
  ok(nextOccurrence({ ...base, days: [], time: '12:00', zone: 'utc' }, mon)!.toISOString() === '2026-11-23T12:00:00.000Z', 'daily UTC reminder later today');
  ok(nextOccurrence({ ...base, days: [], time: '09:00', zone: 'utc' }, mon)!.toISOString() === '2026-11-24T09:00:00.000Z', 'daily UTC reminder rolls to tomorrow');
  ok(nextOccurrence({ ...base, days: [0], time: '00:00', zone: 'utc' }, mon)!.toISOString() === '2026-11-30T00:00:00.000Z', 'weekly Monday reset reminder');
  ok(nextOccurrence({ ...base, days: [5], time: '10:00', zone: 'utc' }, mon)!.toISOString() === '2026-11-28T10:00:00.000Z', 'Saturday reminder');
  ok(weeklyTriggers({ ...base, days: [], time: '12:00', zone: 'utc' }, mon).length === 7 && weeklyTriggers({ ...base, days: [2, 4], time: '12:00', zone: 'utc' }, mon).length === 2, 'one weekly trigger per chosen day');
  ok(normalizeTime('7:05') === '07:05' && normalizeTime('24:00') === null && normalizeTime('ab') === null, 'reminder time validation');
  ok(describeDays([]) === 'Every day' && describeDays([5, 6]) === 'Weekends' && describeDays([0, 2]) === 'Mon, Wed', 'reminder day labels');
}

// Hive planner (tiles: castles/fort/gate 2x2, outposts 1x1)
{
  let h = newHive('t', 'Test', 24, 24);
  h = { ...h, ref: { col: 0, row: 22, x: 252, y: 506 } };
  ok(coordsOf(h, 0, 22).x === 252 && coordsOf(h, 2, 22).x === 254 && coordsOf(h, 0, 20).y === 504, 'tile coords: neighbouring castles 2 apart (Y down)');
  ok(coordsOf({ ...h, yDown: false }, 0, 20).y === 508, 'tile coords with Y going up');
  h = putPiece(h, { kind: 'member', col: 4, row: 6, name: '  Crisa ' })!;
  ok(!!h && h.pieces.some((p) => p.name === 'Crisa' && p.size === 2), 'member castle is 2x2');
  ok(putPiece(h, { kind: 'member', col: 5, row: 7, name: 'Overlap' }) === null && putPiece(h, { kind: 'member', col: 23, row: 0, name: 'Edge' }) === null, 'overlaps and off-plan placements rejected');
  ok(!!putPiece(h, { kind: 'outpost', col: 6, row: 6 }) && pieceAt(h, 5, 7)?.name === 'Crisa', 'outpost fits in a single tile next to a castle');
  h = { ...h, members: parseMembers('Crisa\nSemiX, ~-Ice-~\ncrisa') };
  ok(h.members.length === 3 && unplaced(h).join() === 'SemiX,~-Ice-~', 'member list dedupes and tracks placed names');
  const coloured = putPiece({ ...h, legend: { ...h.legend, green: 'Farms' } }, { kind: 'member', col: 0, row: 0, name: 'FarmA', color: 'green' })!;
  const back = importCode('shared: ' + exportCode(coloured), 'n');
  ok(back.pieces.find((p) => p.name === 'Crisa')?.col === 4 && back.pieces.find((p) => p.name === 'FarmA')?.color === 'green' && back.legend.green === 'Farms' && back.ref.x === 252 && back.members.length === 3 && back.pieces.filter((p) => p.kind === 'fort').length === 1, 'hive share code round-trips');
  ok(resize(h, 5, 5).pieces.every((p) => p.col + p.size <= 5) && resize(h, 99, 1).cols === 60 && resize(h, 1, 1).rows === 2, 'hive resize clamps and drops pieces outside');
  ok(normalizeLegend({ gold: 'R4 / R5', red: 'My leaders' }).gold === 'Alliance member' && normalizeLegend({ red: 'My leaders' }).red === 'My leaders', 'old default labels upgrade; custom labels kept');
  const op = outpostAreas(putPiece(h, { kind: 'outpost', col: 10, row: 10 })!)[0]!;
  ok(op.col0 === 6 && op.col1 === 15 && op.row0 === 6 && op.row1 === 15, 'outpost territory: 10x10 tiles around the outpost');
  // First-version plans (one square = one castle) convert to tiles.
  const v1 = migrateHive({ id: 'old', name: 'Old', cols: 2, rows: 2, cells: [{ kind: 'member', name: 'A', color: 'gold' }, { kind: 'marker' }, { kind: 'fort' }, { kind: 'blocked' }], ref: { col: 0, row: 1, x: 252, y: 506 }, yDown: true, members: [], legend: {} });
  ok(v1.cols === 4 && v1.pieces.find((p) => p.name === 'A')?.size === 2 && v1.pieces.find((p) => p.kind === 'outpost')?.col === 2 && v1.pieces.filter((p) => p.kind === 'blocked').length === 4 && v1.ref.row === 2 && coordsOf(v1, 0, 0).y === 504, 'first-version plans convert to tiles with the same coordinates');
  const fromV1 = importCode('FCHIVE1:' + JSON.stringify({ n: 'X', c: 2, r: 1, g: 'mF', m: { 0: 'Bob' }, ref: { col: 0, row: 0, x: 10, y: 10 } }), 'z');
  ok(fromV1.pieces.find((p) => p.name === 'Bob')?.col === 0 && fromV1.pieces.find((p) => p.kind === 'fort')?.col === 2, 'old share codes still import');
  let threw = false; try { importCode('hello', 'x'); } catch { threw = true; }
  ok(threw, 'invalid hive code rejected');
}

// Alliance-chosen event times
{
  const gate = seed.events.find((e) => e.id === 'infernal-gate')!;
  const tue = new Date(Date.UTC(2026, 10, 24, 8, 0)); // Tuesday 08:00 UTC
  const a0 = { aceLordAnchorWeek: 0, rotationAnchorWeek: 0 };
  const fixed = cleanAllianceTime({ time: '19:00', zone: 'utc', anchorWeek: anchorFor(tue, 'A') })!;
  const s1 = upcomingStarts(gate, fixed, tue, a0, 14);
  ok(s1[0]!.toISOString() === '2026-11-24T19:00:00.000Z' && s1[1]!.toISOString() === '2026-11-27T19:00:00.000Z', 'alliance time on event days (Tue, Fri)');
  const alt = cleanAllianceTime({ time: '19:00', altTime: '21:00', zone: 'utc', anchorWeek: anchorFor(tue, 'A') })!;
  const nextWeek = new Date(tue.getTime() + 7 * 86_400_000);
  ok(timeForWeek(alt, tue) === '19:00' && timeForWeek(alt, nextWeek) === '21:00', 'alternating weekly times');
  ok(upcomingStarts(gate, alt, tue, a0, 14).slice(0, 4).map((d) => d.toISOString().slice(11, 16)).join() === '19:00,19:00,21:00,21:00', 'alternating times across two weeks');
  const thisWeekB = cleanAllianceTime({ time: '19:00', altTime: '21:00', zone: 'utc', anchorWeek: anchorFor(tue, 'B') })!;
  ok(timeForWeek(thisWeekB, tue) === '21:00', 'choose which time applies this week');
  ok(cleanAllianceTime({ time: '25:00', zone: 'utc', anchorWeek: 0 }) === null && !cleanAllianceTime({ time: '19:00', altTime: '19:00', zone: 'utc', anchorWeek: 0 })!.altTime, 'alliance time validation');
}

// One 4-week picker keeps cycle and rotation consistent
{
  const now = new Date(Date.UTC(2026, 10, 24, 12));
  for (const wk of [1, 2, 3, 4] as const) {
    const w = tWeekIndex(now);
    const rotA = w - (wk - 1);
    const aceA = wk % 2 === 1 ? w : w + 1; // same rule as setCycleWeek in the store
    const next = new Date(now.getTime() + 7 * 86_400_000);
    ok(tRotation(now, rotA) === wk && tCycle(now, aceA) === (wk % 2 === 1 ? 'Ace Lord' : 'Arms Race'), `week ${wk} sets a matching cycle`);
    ok(tRotation(next, rotA) === (wk % 4) + 1 && tCycle(next, aceA) !== tCycle(now, aceA), `week ${wk} rolls over consistently`);
  }
}

// The online data pack must match the bundled data (run `npm run pack` after data changes)
{
  const pack = JSON.parse(readPackFile(new URL('../data-pack/manifest.json', import.meta.url), 'utf8')) as { version: number; packs: unknown };
  ok(JSON.stringify(pack.packs) === JSON.stringify(packContent()), 'data pack is up to date (run npm run pack)');
  const parsed = parseManifest(pack);
  ok(parsed.packs.shops!.length === seed.shops.length && parsed.packs.sophia!.length === seed.sophiaQuestions.length, 'data pack parses, including shops');
}

// Heroes whose skills came from in-game screenshots are recognised (unchecked ones get a warning)
{
  const checked = seed.heroes.filter(skillsCheckedInGame).map((h) => h.id);
  ok(['tania', 'boyd', 'edith', 'sirona', 'claudia', 'gina'].every((id) => checked.includes(id)) && checked.length >= 28, 'in-game checked heroes detected');
  ok(seed.heroes.some((h) => !skillsCheckedInGame(h)), 'unchecked heroes flagged');
}

// Every hero has the shared main troop skill table, capped at 500% (+5)
ok(seed.heroes.every((h) => h.marchSkills[0]?.name === 'Troop skill' && h.marchSkills.filter((m) => m.name === 'Troop skill').length === 1 && /500% at \+5/.test(h.marchSkills[0]!.description)), 'main troop skill on every hero, once');

// 5★ unlock rules: 1st troop/civil skill on obtaining, 2nd at Lv. 31, 3rd at Lv. 131
{
  const monica = seed.heroes.find((h) => h.id === 'monica')!;
  ok(monica.civilSkills.map((c) => unlockLevelOf(c)).join() === ',31,131', 'Monica: Castle Battle HP on obtaining, DEF Lv. 31, ATK Lv. 131');
  const saya = seed.heroes.find((h) => h.id === 'saya')!;
  ok(saya.civilSkills.find((c) => c.name === 'Free Speedup Time') && unlockLevelOf(saya.civilSkills.find((c) => c.name === 'Free Speedup Time')!) === null && unlockLevelOf(saya.civilSkills.find((c) => c.name === 'Troop Capacity')!) === 131, 'Saya keeps stated levels; remaining slot is on obtaining');
  const lowMonica = civilBonuses(seed.heroes, { monica: { stars: 5, level: 30, enhancement: 8, bond: 1 } });
  ok(lowMonica.filter((b) => b.active).length === 1, 'below Lv. 31 only the first civil skill is active');
  ok(seed.heroes.filter((h) => h.rarity === 5 && h.match3Skill).every((h) => /Lv\. 71/.test(h.match3Skill!.description)), '5★ hero skill unlock levels shown');
  const odell = seed.heroes.find((h) => h.id === 'odell')!;
  ok(odell.civilSkills.map((c) => unlockLevelOf(c)).join() === ',31,131', '4★ Odell: civil skills on obtaining / Lv. 31 / Lv. 131');
  const claudia = seed.heroes.find((h) => h.id === 'claudia')!;
  ok(unlockLevelOf(claudia.civilSkills[0]!) === null && /Lv\. 31/.test(claudia.marchSkills[1]!.description) && /Lv\. 71/.test(claudia.marchSkills[2]!.description), '3★ Claudia: Lv. 31 and Lv. 71 troop unlocks');
  const isa = seed.heroes.find((h) => h.id === 'isabella')!;
  ok(isa.civilSkills.map((c) => unlockLevelOf(c)).join() === ',31,131', '6★ Isabella: passives on obtaining / Lv. 31 / Lv. 131');
}

ok(fmtDur(5 * 3600_000 + 12 * 60_000 + 9_000) === '05:12:09' && fmtDur(2 * 86_400_000 + 3 * 3600_000 + 12 * 60_000 + 9_000) === '2d 03h 12m 09s', 'countdowns of 24h+ show days');

// Troop training calculator
{
  const per = { food: 100, wood: 100, stone: 20, iron: 5, seconds: 10 };
  const r = trainingCost({ count: 1000, perTroop: per, speedPct: 100, costCutPct: 20, capacity: 300 }, 10);
  ok(r.food === 80000 && r.iron === 4000 && r.seconds === 5000 && r.batches === 4 && r.power === 60000, 'training cost, speed, batches and power');
  ok(affordable({ food: 800, wood: 10000, stone: 10000, iron: 10000 }, per, 20) === 10, 'troops affordable limited by the scarcest resource');
}

// Citadel planner: every level 1-40, boosts on/off, flat cuts
{
  const nb = { civilSpeedPct: 0, builderGearPct: 0, vipPct: 0, institutePct: 0, costReductionPct: 0 };
  for (let from = 1; from < 40; from++) {
    const pl = planCitadel(seed.citadelLevels, from, from + 1, {}, nb);
    ok(pl.levels.length === 1 && pl.levels[0]!.level === from + 1, `Citadel ${from} -> ${from + 1} plans one level`);
  }
  const full = planCitadel(seed.citadelLevels, 1, 40, {}, nb);
  ok(full.levels.length === 39 && full.totals.food > 0, 'Citadel 1 -> 40 covers every level');
  const cut = planCitadel(seed.citadelLevels, 20, 21, {}, { ...nb, costReductionPct: 10, flatCut: { food: 1000 } });
  const base = planCitadel(seed.citadelLevels, 20, 21, {}, nb);
  ok(cut.totals.food === Math.max(0, Math.round(base.totals.food * 0.9) - 1000), 'percentage then flat cut per upgrade');
  const offd = planCitadel(seed.citadelLevels, 20, 21, {}, { ...nb, costReductionPct: 10, off: { costReductionPct: true } });
  ok(offd.totals.food === base.totals.food, 'switched-off boosts are ignored');
  ok(planCitadel(seed.citadelLevels, 1, 2, {}, { ...nb, builderGearPct: 100 }).speed === 2, 'speed boosts add up');
}

