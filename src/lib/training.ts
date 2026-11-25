/** Troop training calculator (pure logic, testable in Node). Tier names, power and camp levels from the community wiki. */

export type TroopType = 'Infantry' | 'Cavalry' | 'Archer';

export const TROOP_TIERS: Record<TroopType, string[]> = {
  Infantry: ['Spearman', 'Swordsman', 'Gladiator', 'Heavy Infantry', 'Berserker', 'Princess Guard', 'Elite Berserker', 'Royal Guard', 'Battlefield Rose', 'Sword Saint', 'Draconic Scion', 'Temple Guardian', 'Apocalypse Bastion'],
  Cavalry: ['Milita Cavalry', 'Light Cavalry', 'Heavy Cavalry', 'Argent Outrider', 'Wolfrider', 'Death Knight', 'Beast Master I', 'Champion Cavalry', 'Stormcaller', 'Beast Master II', 'Valkyrie', 'Temple Cavalry', 'Apocalypse Knight'],
  Archer: ['Archer', 'Light Crossbowman', 'Ranger', 'Heavy Crossbowman', 'Elven Archer', 'Flame Archer', 'Elite Archer', 'Royal Archer', 'Windrunner', 'Witcher', 'Moon Herald', 'Temple Dawnbreaker', 'Apocalypse Windbreaker'],
};
/** Power per troop by tier (T1–T13), the same for every troop type. */
export const TIER_POWER = [4, 6, 8, 12, 15, 20, 25, 33, 45, 60, 80, 100, 125];
/** Camp level that unlocks each tier. */
export const TIER_CAMP_LEVEL = [1, 4, 7, 10, 13, 16, 19, 22, 26, 30, 35, 40, 45];

export interface TroopCost { food: number; wood: number; stone: number; iron: number; seconds: number }
export const RESOURCES = ['food', 'wood', 'stone', 'iron'] as const;

export interface TrainingInput {
  count: number;
  /** Cost and time for ONE troop, as shown in-game before bonuses. */
  perTroop: TroopCost;
  /** Total training speed bonus in % (research, heroes, buffs, VIP…). */
  speedPct: number;
  /** Training cost reduction in %. */
  costCutPct: number;
  /** Troops per training batch (training capacity). 0 = not set. */
  capacity: number;
}

export interface TrainingResult { food: number; wood: number; stone: number; iron: number; seconds: number; batches: number; power: number }

const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);

export function trainingCost(i: TrainingInput, tier: number): TrainingResult {
  const count = Math.floor(n(i.count));
  const cut = Math.min(100, n(i.costCutPct)) / 100;
  const res = (k: (typeof RESOURCES)[number]) => Math.ceil(n(i.perTroop[k]) * count * (1 - cut));
  return {
    food: res('food'), wood: res('wood'), stone: res('stone'), iron: res('iron'),
    // Speed bonuses divide time: +100% speed halves it.
    seconds: Math.ceil((n(i.perTroop.seconds) * count) / (1 + n(i.speedPct) / 100)),
    batches: i.capacity > 0 ? Math.ceil(count / i.capacity) : 0,
    power: count * (TIER_POWER[tier - 1] ?? 0),
  };
}

/** How many troops a stock of resources can pay for. */
export function affordable(stock: Partial<Record<(typeof RESOURCES)[number], number>>, perTroop: TroopCost, costCutPct: number): number {
  const cut = 1 - Math.min(100, n(costCutPct)) / 100;
  let best = Infinity;
  for (const k of RESOURCES) {
    const each = n(perTroop[k]) * cut;
    if (each > 0) best = Math.min(best, Math.floor(n(stock[k] ?? 0) / each));
  }
  return best === Infinity ? 0 : best;
}
