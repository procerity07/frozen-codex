import type { BagDayKey, BagItem, CitadelLevel, CurioStarCost, PhaseReward, ResourceCost, BondLevel, BondGift } from '@/types/game';

/* ------------------------------ Bag Hoard ------------------------------ */

export interface BagLine { item: BagItem; qty: number; points: number }

export function bagPoints(items: BagItem[], inventory: Record<string, number>, day: BagDayKey): { total: number; lines: BagLine[] } {
  const lines = items
    .map((item) => {
      const qty = Math.max(0, inventory[item.id] ?? 0);
      return { item, qty, points: qty * (item.points[day] ?? 0) };
    })
    .filter((l) => l.points > 0)
    .sort((a, b) => b.points - a.points);
  return { total: lines.reduce((s, l) => s + l.points, 0), lines };
}

export interface PhaseProgress { reached: PhaseReward[]; next: PhaseReward | null; remaining: number; ratio: number }

export function phaseProgress(points: number, phases: PhaseReward[]): PhaseProgress {
  const reached = phases.filter((p) => points >= p.points);
  const next = phases.find((p) => points < p.points) ?? null;
  const last = phases[phases.length - 1]!;
  return { reached, next, remaining: next ? next.points - points : 0, ratio: Math.min(1, points / last.points) };
}

/* -------------------------- CoL point exchange -------------------------- */

/** Power per troop by tier (T1..T12). Community estimates. */
export const troopPowerByTier = [2, 3, 5, 8, 12, 17, 23, 30, 38, 47, 57, 68] as const;
/** Realm Expedition foreign kill points by tier (T1..T12), from the community wiki Realm Expedition page. */
export const reKillPointsByTier = [0, 1, 2, 4, 6, 12, 18, 25, 30, 45, 80, 100] as const;

export const COL_POINTS_PER_M_LOST = 400;
export const COL_POINTS_PER_M_KILLED = 100;
export const COL_PERSONAL_TARGET = 12000;

export interface ColExchange { powerNeeded: number; troopsNeeded: number; pointsPerTroop: number }

/** How many troops of `tier` must be lost (or killed) to earn `targetPoints` in Conquest of Lords. */
export function colExchange(targetPoints: number, tier: number, mode: 'lost' | 'killed'): ColExchange {
  const perM = mode === 'lost' ? COL_POINTS_PER_M_LOST : COL_POINTS_PER_M_KILLED;
  const power = troopPowerByTier[Math.min(11, Math.max(0, tier - 1))]!;
  const powerNeeded = Math.ceil((targetPoints / perM) * 1_000_000);
  return { powerNeeded, troopsNeeded: Math.ceil(powerNeeded / power), pointsPerTroop: (power / 1_000_000) * perM };
}

export function reKillPoints(kills: number[]): number {
  return kills.reduce((s, k, i) => s + Math.max(0, k) * (reKillPointsByTier[i] ?? 0), 0);
}

/* ------------------------ Casualty / Sanctuary ------------------------ */

export interface CasualtyInput {
  incoming: number;
  medicalTentCap: number;
  medicalTentUsed: number;
  sanctuaryCap: number;
  sanctuaryUsed: number;
  allianceHospitalCap: number;
  /** Fraction of losses that are wounded at all (rest die immediately, e.g. 30% CoL structure permadeath). */
  permadeathRate: number;
}

export interface CasualtyResult { medicalTent: number; sanctuary: number; allianceHospital: number; dead: number }

export function simulateCasualties(i: CasualtyInput): CasualtyResult {
  const incoming = Math.max(0, i.incoming);
  const instantDead = Math.round(incoming * Math.min(1, Math.max(0, i.permadeathRate)));
  let pool = incoming - instantDead;
  const take = (cap: number) => { const t = Math.min(pool, Math.max(0, cap)); pool -= t; return t; };
  const medicalTent = take(i.medicalTentCap - i.medicalTentUsed);
  const sanctuary = take(i.sanctuaryCap - i.sanctuaryUsed);
  const allianceHospital = take(i.allianceHospitalCap);
  return { medicalTent, sanctuary, allianceHospital, dead: instantDead + pool };
}

/* --------------------------- Citadel deficit --------------------------- */

export type ResourceKey = keyof ResourceCost;
export const RESOURCE_KEYS: ResourceKey[] = ['food', 'wood', 'stone', 'iron', 'ancientTome', 'astronomyTome', 'gloryCodex', 'goldStatue'];

export interface BuildBonuses { civilSpeedPct: number; builderGearPct: number; vipPct: number; institutePct: number; costReductionPct: number }

export interface CitadelPlan {
  levels: CitadelLevel[];
  totals: Record<ResourceKey, number>;
  deficit: Record<ResourceKey, number>;
  baseSeconds: number;
  netSeconds: number;
  /** Levels in the range whose build time is unknown (excluded from the time totals). */
  unknownTimeLevels: number[];
}

export function planCitadel(all: CitadelLevel[], from: number, to: number, owned: Partial<Record<ResourceKey, number>>, b: BuildBonuses): CitadelPlan {
  const levels = all.filter((l) => l.level > from && l.level <= to);
  const costMult = Math.max(0, 1 - b.costReductionPct / 100);
  const totals = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, 0])) as Record<ResourceKey, number>;
  for (const l of levels) for (const k of RESOURCE_KEYS) totals[k] += Math.round((l.cost[k] ?? 0) * costMult);
  const deficit = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, Math.max(0, totals[k] - (owned[k] ?? 0))])) as Record<ResourceKey, number>;
  const baseSeconds = levels.reduce((s, l) => s + (l.baseSeconds ?? 0), 0);
  const unknownTimeLevels = levels.filter((l) => l.baseSeconds === null).map((l) => l.level);
  const speed = 1 + (b.civilSpeedPct + b.builderGearPct + b.vipPct + b.institutePct) / 100;
  return { levels, totals, deficit, baseSeconds, netSeconds: baseSeconds / speed, unknownTimeLevels };
}

/** Recursively expands the prerequisite tree for a Citadel level (one hop per building, using Citadel rows). */
export function prerequisiteTree(all: CitadelLevel[], level: number): { building: string; level: number }[] {
  const row = all.find((l) => l.level === level);
  return row ? row.requires : [];
}

/* ------------------------------ Bond & Curio ------------------------------ */

export function bondExpBetween(levels: BondLevel[], from: number, to: number): number {
  return levels.filter((l) => l.level >= from && l.level < to).reduce((s, l) => s + l.expToNext, 0);
}

/** Greedy gift plan: uses the largest owned gifts first, returns EXP covered and leftover need. */
export function bondGiftPlan(gifts: BondGift[], owned: Record<number, number>, expNeeded: number) {
  let need = expNeeded;
  const used: { tier: number; count: number }[] = [];
  for (const g of [...gifts].sort((a, b) => b.exp - a.exp)) {
    const have = owned[g.tier] ?? 0;
    const n = Math.min(have, Math.floor(need / g.exp));
    if (n > 0) { used.push({ tier: g.tier, count: n }); need -= n * g.exp; }
  }
  // top up with the smallest gift that covers the remainder
  for (const g of [...gifts].sort((a, b) => a.exp - b.exp)) {
    if (need <= 0) break;
    const left = (owned[g.tier] ?? 0) - (used.find((u) => u.tier === g.tier)?.count ?? 0);
    if (left > 0) {
      const n = Math.min(left, Math.ceil(need / g.exp));
      const u = used.find((x) => x.tier === g.tier);
      if (u) u.count += n; else used.push({ tier: g.tier, count: n });
      need -= n * g.exp;
    }
  }
  return { used: used.sort((a, b) => a.tier - b.tier), shortfall: Math.max(0, need) };
}

export function curioCost(costs: CurioStarCost[], from: number, to: number) {
  const rows = costs.filter((c) => c.star > from && c.star <= to);
  return { spinel: rows.reduce((s, r) => s + r.spinel, 0), crystal: rows.reduce((s, r) => s + r.crystal, 0), unlocks: rows.map((r) => `${r.star}★ ${r.unlocks}`) };
}

/* ----------------------------- Formatting ----------------------------- */

export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString('en-US');
}

export const fmtFull = (n: number) => Math.round(n).toLocaleString('en-US');
