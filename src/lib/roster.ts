/** Pure roster logic: clamping saved entries to game rules and deriving progress hints. */
import type { CivilSkill, Hero } from '@/types/game';
import {
  ABSOLUTE_MAX_LEVEL, BOND_ENHANCEMENT_GATES, ENHANCEMENT_SHARDS, LEVEL_CAP_BY_STARS, MAX_ENHANCEMENT,
  MAX_ENHANCEMENT_BELOW_5_STARS, PROMOTION, SKILL_UNLOCK_LEVELS, SPECIALTY,
} from '@/data/seed/heroProgression';

export interface RosterEntry {
  /** Current stars (starts at the hero's base rarity; 5★ heroes can be promoted to 6★). */
  stars: number;
  level: number;
  /** 0 = Hero0 (just obtained) … 8 = +8. */
  enhancement: number;
  bond: number;
}

/** Bond (favorability) goes to at least Lv. 99 (in-game bond goals). */
export const BOND_MAX = 99;
/** Only 5★ and 6★ heroes have bonds. */
export const hasBonds = (hero: Pick<Hero, 'rarity'>) => hero.rarity >= 5;

const clampInt = (n: unknown, lo: number, hi: number, fallback: number) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(hi, Math.max(lo, v));
};

export const maxStars = (hero: Pick<Hero, 'rarity'>) => (hero.rarity === PROMOTION.fromStars ? PROMOTION.toStars : hero.rarity);
export const levelCap = (stars: number) => LEVEL_CAP_BY_STARS[stars] ?? null;
export const maxEnhancement = (stars: number) => (stars < 5 ? MAX_ENHANCEMENT_BELOW_5_STARS : MAX_ENHANCEMENT);

export function newEntry(hero: Pick<Hero, 'rarity'>): RosterEntry {
  return { stars: hero.rarity, level: 0, enhancement: 0, bond: 0 };
}

/** Makes any saved or imported entry valid for this hero (protects against bad backups or old data). */
export function clampEntry(hero: Pick<Hero, 'rarity'>, raw: Partial<RosterEntry> | undefined): RosterEntry {
  const stars = clampInt(raw?.stars, hero.rarity, maxStars(hero), hero.rarity);
  const cap = levelCap(stars) ?? ABSOLUTE_MAX_LEVEL;
  return {
    stars,
    level: clampInt(raw?.level, 0, cap, 0),
    enhancement: clampInt(raw?.enhancement, 0, maxEnhancement(stars), 0),
    bond: hasBonds(hero) ? clampInt(raw?.bond, 0, BOND_MAX, 0) : 0,
  };
}

export const enhancementLabel = (e: number) => (e === 0 ? 'Hero0' : `+${e}`);

/** Shards to go from the current enhancement to the target (Hero0 = already obtained). */
export function shardsBetween(current: number, target: number): number {
  let total = 0;
  for (let step = current + 1; step <= target; step++) total += ENHANCEMENT_SHARDS[step] ?? 0;
  return total;
}

/** Highest bond level this enhancement allows; null when the source has no gate for higher bands. */
export function bondCapForEnhancement(enhancement: number): number | null {
  let cap = 0;
  for (const g of BOND_ENHANCEMENT_GATES) if (enhancement >= g.enhancement) cap = g.maxBond;
  const last = BOND_ENHANCEMENT_GATES[BOND_ENHANCEMENT_GATES.length - 1]!;
  return enhancement > last.enhancement ? null : cap;
}

export function requiredEnhancementForBond(bond: number): number | null {
  return BOND_ENHANCEMENT_GATES.find((g) => bond <= g.maxBond)?.enhancement ?? null;
}

export interface PromotionStatus { eligible: boolean; possible: boolean; missing: string[] }

export function promotionStatus(hero: Pick<Hero, 'rarity'>, e: RosterEntry): PromotionStatus {
  if (hero.rarity !== PROMOTION.fromStars || e.stars !== PROMOTION.fromStars) return { eligible: false, possible: false, missing: [] };
  const missing: string[] = [];
  if (e.level < PROMOTION.level) missing.push(`Lv. ${PROMOTION.level} (now ${e.level})`);
  if (e.enhancement < PROMOTION.enhancement) missing.push(`+${PROMOTION.enhancement} enhancement (now ${enhancementLabel(e.enhancement)})`);
  return { eligible: missing.length === 0, possible: true, missing };
}

export const specialtyUnlocked = (e: RosterEntry) => e.enhancement >= SPECIALTY.enhancement && e.level >= SPECIALTY.level;

export function nextSkillUnlock(level: number) {
  return SKILL_UNLOCK_LEVELS.find((s) => s.level > level) ?? null;
}

/** Parses "Unlocks at level 131" style requirements; null when the unlock level is unknown. */
export function unlockLevelOf(skill: Pick<CivilSkill, 'requirement'>): number | null {
  const m = /level\s+(\d+)/i.exec(skill.requirement);
  return m ? Number(m[1]) : null;
}

export interface CivilBonus {
  hero: string;
  heroId: string;
  skill: string;
  stat?: CivilSkill['stat'];
  /** Exact value at the hero's current stars/enhancement when the source gives it. */
  value: number | null;
  unit: '%' | 'flat' | 'min' | null;
  /** false when the hero is below the skill's unlock level. */
  active: boolean;
  note: string;
}

/** Lists every civil skill of owned heroes, with an exact value only where the source table covers it. */
export function civilBonuses(heroes: Hero[], roster: Record<string, RosterEntry>): CivilBonus[] {
  const out: CivilBonus[] = [];
  for (const h of heroes) {
    const raw = roster[h.id];
    if (!raw) continue;
    const e = clampEntry(h, raw);
    for (const s of h.civilSkills) {
      const unlock = unlockLevelOf(s);
      const active = unlock === null || e.level >= unlock;
      const table = s.tiers?.[String(e.stars)];
      const v = table?.[e.enhancement];
      const value = typeof v === 'number' ? v : null;
      out.push({
        hero: h.name, heroId: h.id, skill: s.name, stat: s.stat, value, unit: s.unit ?? null, active,
        note: !active ? `Unlocks at Lv. ${unlock}` : value === null ? 'Value not verified' : `${e.stars}★ ${enhancementLabel(e.enhancement)}`,
      });
    }
  }
  return out;
}

export interface RosterFile { app: 'frozen-codex'; kind: 'roster'; version: 1; roster: Record<string, RosterEntry> }

/**
 * Reads a roster file (or a full profile backup that contains a roster). Entries for heroes the app
 * doesn't know are skipped; every value is clamped to game rules.
 */
export function parseRosterFile(raw: unknown, heroes: Pick<Hero, 'id' | 'rarity'>[]): { entries: Record<string, RosterEntry>; skipped: string[] } {
  if (typeof raw !== 'object' || raw === null) throw new Error('Not a roster file');
  const obj = raw as Record<string, unknown>;
  const src = (obj.roster ?? (typeof obj.profile === 'object' && obj.profile ? (obj.profile as Record<string, unknown>).roster : undefined)) as unknown;
  if (typeof src !== 'object' || src === null || Array.isArray(src)) throw new Error('No roster found in this file');
  const entries: Record<string, RosterEntry> = {};
  const skipped: string[] = [];
  for (const [id, value] of Object.entries(src as Record<string, unknown>)) {
    const hero = heroes.find((h) => h.id === id);
    if (!hero || typeof value !== 'object' || value === null) { skipped.push(id); continue; }
    entries[id] = clampEntry(hero, value as Partial<RosterEntry>);
  }
  return { entries, skipped };
}

export function makeRosterFile(roster: Record<string, RosterEntry>): RosterFile {
  return { app: 'frozen-codex', kind: 'roster', version: 1, roster };
}
