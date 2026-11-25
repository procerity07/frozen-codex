/**
 * Recommended march from the player's own heroes.
 *
 * Rules (from experienced players):
 * - Civil heroes never go in a march.
 * - Enhancement beats stars: the main troop skill is 100/120/150/200/300/500% of troop ATK from Hero0 to +5,
 *   so a +5 hero (500%) outranks a higher-star hero at +2 (150%).
 * - Beginner: five heroes of the chosen troop type.
 * - Advanced: four of the chosen type + one off-type. In Monster Dens only four same-type troop skills
 *   activate, so the fifth slot goes to a "hybrid" (another type whose unlocked skill buffs the chosen type,
 *   e.g. Selantia: Infantry with Cavalry ATK), else to a general Troop ATK buffer (Sodoma, Freya, …).
 * - A buff skill only counts once the hero's level has reached its unlock level.
 */
import type { Hero } from '@/types/game';
import { clampEntry, enhancementLabel, type RosterEntry } from './roster';

export type MarchType = 'Infantry' | 'Cavalry' | 'Archer';
export type MarchMode = 'beginner' | 'advanced';
export const MARCH_TYPES: MarchType[] = ['Infantry', 'Cavalry', 'Archer'];

/** Main troop skill share of troop ATK by enhancement (capped at +5). */
export const MAIN_SKILL_PCT = [100, 120, 150, 200, 300, 500];
export const mainSkillPct = (enhancement: number) => MAIN_SKILL_PCT[Math.min(5, Math.max(0, enhancement))]!;

export interface Buff { skill: string; target: MarchType | 'Troop'; stat: 'ATK' | 'DEF' | 'HP'; unlocked: boolean; unlockLevel: number | null }

const TYPE_WORD: Record<string, MarchType | 'Troop'> = { infantry: 'Infantry', cavalry: 'Cavalry', rider: 'Cavalry', archer: 'Archer', troop: 'Troop' };

/** Stat buffs among a hero's march skills, and whether each is unlocked at the hero's level. */
export function heroBuffs(hero: Hero, level: number): Buff[] {
  const out: Buff[] = [];
  for (const m of hero.marchSkills) {
    const k = /^(infantry|cavalry|rider|archer|troop)s?\s+(atk|def|hp)\b/i.exec(m.name.trim());
    if (!k) continue;
    const lv = /unlocks at lv\.\s*(\d+)/i.exec(m.description);
    const unlockLevel = lv ? Number(lv[1]) : null;
    out.push({ skill: m.name, target: TYPE_WORD[k[1]!.toLowerCase()]!, stat: k[2]!.toUpperCase() as Buff['stat'], unlocked: unlockLevel === null || level >= unlockLevel, unlockLevel });
  }
  return out;
}

export interface MarchPick {
  hero: Hero;
  entry: RosterEntry;
  role: 'core' | 'hybrid' | 'troop-buffer' | 'filler';
  mainPct: number;
  /** Unlocked buffs that help the chosen troop type. */
  helps: Buff[];
  reason: string;
}

const isMilitary = (h: Hero) => h.unitType !== 'Civil';

function score(p: { entry: RosterEntry; mainPct: number; helps: Buff[] }): number {
  const atk = p.helps.filter((b) => b.stat === 'ATK').length;
  const other = p.helps.length - atk;
  // Enhancement (main skill) first, then buffs for the chosen type, then stars and level as tie-breakers.
  return p.mainPct * 1000 + atk * 60 + other * 30 + p.entry.stars * 5 + p.entry.level / 100;
}

export interface MarchPlan { type: MarchType; mode: MarchMode; picks: MarchPick[]; notes: string[] }

export function recommendMarch(heroes: Hero[], roster: Record<string, RosterEntry>, type: MarchType, mode: MarchMode): MarchPlan {
  const owned = heroes.filter((h) => roster[h.id] && isMilitary(h)).map((h) => {
    const entry = clampEntry(h, roster[h.id]);
    const buffs = heroBuffs(h, entry.level);
    const helps = buffs.filter((b) => b.unlocked && (b.target === type || b.target === 'Troop'));
    return { hero: h, entry, mainPct: mainSkillPct(entry.enhancement), helps, buffs };
  });

  const core = owned.filter((o) => o.hero.unitType === type).sort((a, b) => score(b) - score(a));
  const others = owned.filter((o) => o.hero.unitType !== type);
  const hybrids = others.filter((o) => o.helps.some((b) => b.target === type && b.stat === 'ATK')).sort((a, b) => score(b) - score(a));
  const buffers = others.filter((o) => !hybrids.includes(o) && o.helps.some((b) => b.target === 'Troop' && b.stat === 'ATK')).sort((a, b) => score(b) - score(a));
  const rest = others.filter((o) => !hybrids.includes(o) && !buffers.includes(o)).sort((a, b) => score(b) - score(a));

  const why = (o: typeof owned[number], role: MarchPick['role']): string => {
    const base = `${o.entry.stars}★ ${enhancementLabel(o.entry.enhancement)} · Lv ${o.entry.level} · troop skill ${o.mainPct}%`;
    if (role === 'hybrid') return `${base} · ${o.hero.unitType} hero whose ${o.helps.filter((b) => b.target === type).map((b) => b.skill).join(', ')} boosts your ${type}`;
    if (role === 'troop-buffer') return `${base} · buffs all troops (${o.helps.filter((b) => b.target === 'Troop').map((b) => b.skill).join(', ')})`;
    if (role === 'filler') return `${base} · fills the last slot (not ${type})`;
    const extra = o.helps.map((b) => b.skill);
    return extra.length ? `${base} · ${extra.join(', ')}` : base;
  };
  const pick = (o: typeof owned[number], role: MarchPick['role']): MarchPick => ({ hero: o.hero, entry: o.entry, role, mainPct: o.mainPct, helps: o.helps, reason: why(o, role) });

  const picks: MarchPick[] = [];
  const notes: string[] = [];
  const coreCount = mode === 'advanced' ? 4 : 5;
  core.slice(0, coreCount).forEach((o) => picks.push(pick(o, 'core')));

  const offPool: [typeof owned, MarchPick['role']][] = [[hybrids, 'hybrid'], [buffers, 'troop-buffer'], [rest, 'filler']];
  if (mode === 'advanced') {
    for (const [pool, role] of offPool) {
      if (pool[0]) { picks.push(pick(pool[0], role)); break; }
    }
    if (core.length < 4) notes.push(`You have ${core.length} ${type} hero${core.length === 1 ? '' : 'es'} in My Roster; an advanced march uses four.`);
    if (!hybrids.length) notes.push(`No hybrid hero for ${type} yet (another type with a ${type} ATK skill unlocked). A Troop ATK hero is the next best fifth.`);
  }
  // Fill any empty slots with the best remaining heroes.
  const used = new Set(picks.map((p) => p.hero.id));
  for (const [pool, role] of [[core, 'core'], ...offPool] as [typeof owned, MarchPick['role']][]) {
    for (const o of pool) {
      if (picks.length >= 5) break;
      if (!used.has(o.hero.id)) { picks.push(pick(o, role)); used.add(o.hero.id); }
    }
  }
  const low = picks.filter((p) => p.entry.enhancement < 5 && p.role === 'core');
  if (low.length) notes.push(`${low.map((p) => p.hero.name).join(', ')} ${low.length === 1 ? 'is' : 'are'} below +5. Reaching +5 raises the troop skill to 500%, the biggest single upgrade.`);
  if (picks.length < 5) notes.push('Add more military heroes to My Roster to fill all five slots.');
  return { type, mode, picks, notes };
}
