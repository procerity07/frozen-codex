/* Validates seed integrity, runs the real migrations + seeder on SQLite, and exercises search + calculators. */
import assert from 'node:assert/strict';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as seed from '../src/data/seed';
import { migrations } from '../src/db/schema';
import { bundledEventsToSeed, bundledHeroesToSeed, mergePackEvents, mergePackHeroes, seedDatabase, upsertEvents, upsertHeroes } from '../src/db/seed';
import { combatRoleLabel, normalizeHero } from '../src/lib/heroData';
import { reKillPointsByTier } from '../src/lib/calculators';
import { compareVersions, isNewer, notesToBlocks, parseRelease } from '../src/lib/appUpdate';
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
ok(seed.shops.length === 12, 'shops must be 12');
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
  ok(seed.citadelLevels.find((l) => l.level === 40)!.cost.iron === 28_843_963, 'citadel 40 iron');
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
  ok(todayThemes(mon, a).map((t) => t.theme).join('|') === 'Heroes Assemble (Hero Upgrade)|Rune & Holystone', 'Monday themes');
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
  ok(xk.unitType === 'Civil' && xk.revision === 1, 'existing install receives corrected Khaos on re-seed');
  ok((xdb.raw.prepare("SELECT COUNT(*) n FROM heroes_fts WHERE id = 'khaos'").get() as { n: number }).n === 1, 'FTS row replaced, not duplicated');

  // (f) A future pack at the same or newer revision still applies.
  const newer = await mergePackHeroes(rdb as unknown as SQLiteDatabase, [{ ...byId('eric'), revision: 2, notes: 'pack v4 note' }]);
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
  ok(livePack.version >= 3 && livePack.packs.heroes!.length === seed.heroes.length && livePack.packs.heroes!.every((h) => h.revision === seed.HERO_DATA_REVISION), 'published pack matches bundled heroes');
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

  console.log(`Seed validation passed: ${checks} checks · ${seed.heroes.length} heroes · ${seed.events.length} events · ${seed.sophiaQuestions.length} Sophia answers · ${seed.giftCodes.length} codes`);
})().catch((e) => { console.error(e); process.exit(1); });
