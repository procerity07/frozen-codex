import type {
  BuildingInfo, CitadelLevel, DraconicStone, DragonLairRow, GearSlot, GearStage, GloryBuilding, HolystoneSet, RuneSet, TotemSet, UpgradeCostRow,
} from '@/types/game';

export const buildings: BuildingInfo[] = [
  { id: 'citadel', name: 'Citadel', purpose: 'Core building; caps every other building level.', maxLevel: 40, unlockCitadel: 1 },
  { id: 'wall', name: 'Wall', purpose: 'City defence; required for every Citadel level.', maxLevel: 40, unlockCitadel: 1, gloryStat: 'Troop DEF' },
  { id: 'lookout', name: 'Lookout', purpose: 'Scouting and incoming-march intel.', maxLevel: 40, unlockCitadel: 3, gloryStat: 'Troop HP' },
  { id: 'warehouse', name: 'Warehouse', purpose: 'Protects resources from plunder.', maxLevel: 40, unlockCitadel: 2 },
  { id: 'mesdi-portal', name: 'Mesdi Portal', purpose: 'Portal chapters (24) and Monthly Recruit Trial.', maxLevel: 40, unlockCitadel: 5 },
  { id: 'archer-camp', name: 'Archer Camp', purpose: 'Trains Archers.', maxLevel: 40, unlockCitadel: 1, gloryStat: 'Archer ATK' },
  { id: 'infantry-camp', name: 'Infantry Camp', purpose: 'Trains Infantry.', maxLevel: 40, unlockCitadel: 1, gloryStat: 'Infantry ATK' },
  { id: 'cavalry-camp', name: 'Cavalry Camp', purpose: 'Trains Cavalry.', maxLevel: 40, unlockCitadel: 1, gloryStat: 'Cavalry ATK' },
  { id: 'vehicle-workshop', name: 'Vehicle Workshop', purpose: 'Siege vehicles.', maxLevel: 40, unlockCitadel: 8, gloryStat: 'Troop ATK' },
  { id: 'medical-tent', name: 'Medical Tent', purpose: 'Holds wounded troops (T1 buffer).', maxLevel: 40, unlockCitadel: 2, gloryStat: 'Troop HP' },
  { id: 'weapon-forge', name: 'Weapon Forge', purpose: 'Gear, Curios (Lv. 20), Totems (Lv. 16), Holystones (Lv. 25).', maxLevel: 40, unlockCitadel: 6, gloryStat: 'Troop Lethality' },
  { id: 'posthouse', name: 'Posthouse', purpose: 'Resource transfer to allies.', maxLevel: 40, unlockCitadel: 7 },
  { id: 'furnace', name: 'Furnace', purpose: 'Iron production.', maxLevel: 40, unlockCitadel: 4 },
  { id: 'quarry', name: 'Quarry', purpose: 'Stone production.', maxLevel: 40, unlockCitadel: 3 },
  { id: 'embassy', name: 'Embassy', purpose: 'Alliance reinforcement capacity.', maxLevel: 40, unlockCitadel: 4, gloryStat: 'Infantry DEF' },
  { id: 'lumberyard', name: 'Lumberyard', purpose: 'Wood production.', maxLevel: 40, unlockCitadel: 1 },
  { id: 'war-hall', name: 'War Hall', purpose: 'Rally capacity.', maxLevel: 40, unlockCitadel: 10, gloryStat: 'Cavalry DEF' },
  { id: 'institute', name: 'Institute', purpose: 'Research; Formations at Lv. 28.', maxLevel: 40, unlockCitadel: 3, gloryStat: 'Archer DEF' },
  { id: 'sanctuary', name: 'Sanctuary', purpose: 'Holy Light free revival of dead troops.', maxLevel: 40, unlockCitadel: 12 },
];

const unlockNotes: Record<number, string[]> = {
  6: ['Lich Attack', 'Weapon Forge'], 10: ['Fort Contest', 'War Hall'], 12: ['Sanctuary'], 15: ['Glory Levels', 'Alliance Showdown'],
  16: ['Totem Set I'], 20: ['Curios', 'Rune Set V'], 25: ['Holystone Set I', 'Ancient Tomes'], 28: ['Institute Formations'], 30: ['Astronomy Tomes', 'T11 troops'],
  31: ['Totem Set V', 'Holystone Set IV'], 33: ['Glory Codex'], 35: ['T12 troops'], 37: ['Gold Statues'], 40: ['Max Citadel'],
};

/**
 * CITADEL (HQ) LEVELS — edit any value here.
 * Source: player-supplied community table (Citadel 1–40).
 *  - requires: buildings needed before upgrading, as ['Building', level]
 *  - time: build time as dhms(days, hours, minutes, seconds); null = unknown
 *  - food / wood / stone / iron: resource cost (_ is just a thousands separator)
 *  - ancientTome / astronomyTome / gloryCodex / goldStatue: optional, add e.g. ancientTome: 20 to a row
 * Level 9 wood was printed as "163.00" in the source and is entered as 163_000.
 */
interface CitadelRow {
  requires: [string, number][];
  time: number | null;
  food: number; wood: number; stone: number; iron: number;
  ancientTome?: number; astronomyTome?: number; gloryCodex?: number; goldStatue?: number;
}

const dhms = (d: number, h: number, m: number, s: number) => ((d * 24 + h) * 60 + m) * 60 + s;

const citadelTable: Record<number, CitadelRow> = {
  1: { requires: [], time: 0, food: 2_080, wood: 2_080, stone: 0, iron: 0 },
  2: { requires: [], time: null, food: 2_920, wood: 2_920, stone: 0, iron: 0 },
  3: { requires: [], time: null, food: 4_370, wood: 4_370, stone: 0, iron: 0 },
  4: { requires: [['Wall', 3], ['Embassy', 1]], time: null, food: 6_990, wood: 6_990, stone: 0, iron: 0 },
  5: { requires: [['Wall', 4], ['Farm', 4], ['Residence', 4]], time: dhms(0, 1, 16, 39), food: 11_900, wood: 11_900, stone: 0, iron: 0 },
  6: { requires: [['Wall', 5], ['Warehouse', 5], ['Infantry Camp', 5]], time: dhms(0, 6, 2, 30), food: 21_400, wood: 21_400, stone: 0, iron: 0 },
  7: { requires: [['Wall', 6], ['Cavalry Camp', 6], ['Archery Camp', 6]], time: dhms(0, 9, 24, 38), food: 40_700, wood: 40_700, stone: 0, iron: 0 },
  8: { requires: [['Wall', 7], ['Institute', 7]], time: dhms(0, 13, 41, 57), food: 81_300, wood: 81_300, stone: 0, iron: 0 },
  9: { requires: [['Wall', 8], ['Weapon Forge', 8]], time: dhms(0, 17, 25, 14), food: 163_000, wood: 163_000, stone: 0, iron: 0 },
  10: { requires: [['Wall', 9], ['Warehouse', 9]], time: dhms(0, 21, 30, 47), food: 326_000, wood: 326_000, stone: 0, iron: 0 },
  11: { requires: [['Wall', 10], ['Medical Tent', 10]], time: null, food: 627_000, wood: 627_000, stone: 6_600, iron: 0 },
  12: { requires: [['Wall', 11], ['Vehicle Workshop', 11]], time: dhms(1, 8, 31, 30), food: 1_140_000, wood: 1_140_000, stone: 25_400, iron: 0 },
  13: { requires: [['Wall', 12], ['Lookout', 12]], time: dhms(1, 15, 56, 49), food: 1_920_000, wood: 1_920_000, stone: 67_800, iron: 0 },
  14: { requires: [['Wall', 13], ['Archer Camp', 13]], time: dhms(2, 0, 57, 45), food: 3_020_000, wood: 3_020_000, stone: 150_800, iron: 0 },
  15: { requires: [['Wall', 14], ['Posthouse', 14]], time: dhms(2, 12, 44, 47), food: 4_380_000, wood: 4_380_000, stone: 292_000, iron: 0 },
  16: { requires: [['Wall', 15], ['Furnace', 15]], time: dhms(3, 3, 15, 55), food: 6_020_000, wood: 5_850_000, stone: 502_000, iron: 0 },
  17: { requires: [['Wall', 16], ['Quarry', 16]], time: dhms(3, 21, 27, 27), food: 7_780_000, wood: 6_770_000, stone: 790_000, iron: 28_200 },
  18: { requires: [['Wall', 17], ['Infantry Camp', 17]], time: dhms(4, 19, 41, 38), food: 10_100_000, wood: 7_610_000, stone: 1_218_000, iron: 76_500 },
  19: { requires: [['Wall', 18], ['Embassy', 18]], time: dhms(5, 23, 10, 54), food: 13_000_000, wood: 8_220_000, stone: 1_850_000, iron: 154_500 },
  20: { requires: [['Wall', 19], ['Cavalry Camp', 19]], time: dhms(7, 2, 2, 36), food: 16_700_000, wood: 8_330_000, stone: 2_780_000, iron: 277_500 },
  21: { requires: [['Wall', 20], ['Lumberyard', 20]], time: dhms(8, 9, 44, 15), food: 21_400_000, wood: 7_490_000, stone: 4_120_000, iron: 468_500 },
  22: { requires: [['Wall', 21], ['War Hall', 21]], time: dhms(10, 2, 41, 12), food: 27_300_000, wood: 5_060_000, stone: 6_080_000, iron: 760_000 },
  23: { requires: [['Wall', 22], ['Infantry Camp', 22]], time: dhms(12, 3, 56, 38), food: 36_200_000, wood: 6_830_000, stone: 7_520_000, iron: 1_195_000 },
  24: { requires: [['Wall', 23], ['Cavalry Camp', 23]], time: dhms(14, 14, 55, 28), food: 48_000_000, wood: 9_220_000, stone: 9_220_000, iron: 1_845_000 },
  25: { requires: [['Wall', 24], ['Institute', 24]], time: dhms(17, 13, 49, 13), food: 63_500_000, wood: 12_500_000, stone: 11_200_000, iron: 2_800_000 },
  26: { requires: [['Wall', 25], ['Embassy', 25]], time: dhms(21, 7, 22, 30), food: 84_000_000, wood: 16_800_000, stone: 13_440_000, iron: 4_200_000 },
  27: { requires: [['Wall', 26], ['Warehouse', 26]], time: dhms(25, 18, 56, 30), food: 114_000_000, wood: 22_700_000, stone: 15_880_000, iron: 6_250_000 },
  28: { requires: [['Wall', 27], ['Infantry Camp', 27]], time: dhms(30, 21, 39, 12), food: 154_000_000, wood: 30_700_000, stone: 18_380_000, iron: 9_200_000 },
  29: { requires: [['Wall', 28], ['Vehicle Depot', 28]], time: dhms(37, 1, 30, 20), food: 207_000_000, wood: 41_400_000, stone: 24_800_000, iron: 12_400_000 },
  30: { requires: [['Wall', 29], ['Shooter Camp', 29]], time: dhms(46, 17, 7, 28), food: 279_000_000, wood: 55_800_000, stone: 33_600_000, iron: 16_750_000 },
  31: { requires: [['Wall', 30], ['Infantry Camp', 30], ['Research Center', 30]], time: null, food: 377_000_000, wood: 75_300_000, stone: 45_200_000, iron: 22_600_000 },
  32: { requires: [['Wall', 31], ['Cavalry Camp', 31]], time: null, food: 377_000_000, wood: 94_800_000, stone: 45_200_000, iron: 22_600_000 },
  33: { requires: [['Wall', 32], ['Archery Camp', 32]], time: null, food: 377_000_000, wood: 114_300_000, stone: 45_200_000, iron: 22_600_000 },
  34: { requires: [['Wall', 33], ['Vehicle Workshop', 33]], time: null, food: 377_000_000, wood: 133_800_000, stone: 45_200_000, iron: 22_600_000 },
  35: { requires: [['Wall', 34], ['Wishing Pool', 34], ['Posthouse', 34]], time: null, food: 377_000_000, wood: 153_300_000, stone: 45_200_000, iron: 22_600_000 },
  36: { requires: [['Institute', 35]], time: null, food: 395_850_000, wood: 160_965_000, stone: 47_460_000, iron: 23_730_000 },
  37: { requires: [['Wall', 36], ['War Hall', 36], ['Institute', 36], ['Vehicle Workshop', 36]], time: null, food: 415_642_500, wood: 169_013_250, stone: 49_833_000, iron: 24_916_500 },
  38: { requires: [['Wall', 37], ['War Hall', 37], ['Institute', 37], ['Infantry Camp', 37]], time: null, food: 436_424_625, wood: 177_463_912, stone: 52_324_650, iron: 26_162_325 },
  39: { requires: [['Wall', 38], ['War Hall', 38], ['Institute', 38], ['Archery Camp', 38]], time: null, food: 458_245_856, wood: 186_337_107, stone: 54_940_882, iron: 27_470_441 },
  40: { requires: [['Wall', 39], ['War Hall', 39], ['Institute', 39], ['Cavalry Camp', 39]], time: null, food: 481_158_148, wood: 195_653_962, stone: 57_687_926, iron: 28_843_963 },
};

export const citadelLevels: CitadelLevel[] = Object.entries(citadelTable).map(([lv, r]) => ({
  level: Number(lv),
  requires: r.requires.map(([building, level]) => ({ building, level })),
  cost: {
    food: r.food, wood: r.wood, stone: r.stone, iron: r.iron,
    ancientTome: r.ancientTome, astronomyTome: r.astronomyTome, gloryCodex: r.gloryCodex, goldStatue: r.goldStatue,
  },
  baseSeconds: r.time,
  unlocks: unlockNotes[Number(lv)] ?? [],
  confidence: 'community',
}));

export const gearSlots: GearSlot[] = [
  { slot: 'Weapon', attack: 'Cavalry', defense: 'Infantry' },
  { slot: 'Shield', attack: 'Archer', defense: 'Cavalry' },
  { slot: 'Chestplate', attack: 'Infantry', defense: 'Archer' },
  { slot: 'Helmet', attack: 'Infantry', defense: 'Cavalry' },
  { slot: 'Ring', attack: 'Cavalry', defense: 'Archer' },
  { slot: 'Shoes', attack: 'Archer', defense: 'Infantry' },
];

export const gearStages: GearStage[] = [
  { name: 'Enhancement', material: 'Gear Essence', description: 'Raises base stats every level. Use 1 essence for the daily quest, save bulk for Ace Lord Day 6 / Arms Race Day 3.' },
  { name: 'Ascension', material: 'Gear Energy Spinel & Crystal', description: 'Raises the level cap and quality tier.' },
  { name: 'Modification', material: 'Modification Stones', description: 'Rerolls secondary stats — lock the troop type you main.' },
  { name: 'Refinement', material: 'Refinement Crests', description: 'Flat Lethality/HP bonuses. Crests score on Ace Lord Day 5.' },
  { name: 'Builders Set', material: 'Set pieces', description: 'Construction speed set — swap in before long builds.' },
  { name: 'Tech Set', material: 'Set pieces', description: 'Research speed set — swap in before long research.' },
];

/**
 * Rune upgrade requirements.
 * All zeroes are placeholders — replace with verified costs.
 * Keep the meaning of "level" consistent across every row.
 */
const runeUpgradeCosts: UpgradeCostRow[] = [
  { level: 1, essence: 0, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 2, essence: 50, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 3, essence: 50, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 4, essence: 100, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 5, essence: 150, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 6, essence: 200, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 7, essence: 300, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 8, essence: 400, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 9, essence: 550, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 10, essence: 700, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 11, essence: 900, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 12, essence: 1150, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 13, essence: 1500, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 14, essence: 2000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 15, essence: 2750, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 16, essence: 3700, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 17, essence: 5000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 18, essence: 6700, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 19, essence: 8700, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 20, essence: 12700, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 21, essence: 14000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 22, essence: 17000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 23, essence: 20000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 24, essence: 24000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 25, essence: 27000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 26, essence: 30000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 27, essence: 33000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 28, essence: 36000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 29, essence: 39000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 30, essence: 42000, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 31, essence: 45000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 32, essence: 48000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 33, essence: 51000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 34, essence: 54000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 35, essence: 57000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 36, essence: 60000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 37, essence: 63000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 38, essence: 66000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 39, essence: 69000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 40, essence: 72000, spinel: 0, crystal: 0, arcaneCore: 0 },
];

/**
 * Totem enhancement requirements.
 * Each row represents the cost to reach that level.
 *
 * Level 1: zero placeholder; no cost supplied.
 * Level 13: 1,800 essence.
 * Level 21: 16,000 essence.
 * Levels 22–40: +4,000 essence per level.
 *
 * Separate ascension requirements are not included.
 */
const totemUpgradeCosts: UpgradeCostRow[] = [
  { level: 1, essence: 0, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 2, essence: 100, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 3, essence: 100, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 4, essence: 400, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 5, essence: 200, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 6, essence: 250, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 7, essence: 400, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 8, essence: 500, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 9, essence: 700, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 10, essence: 850, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 11, essence: 1_100, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 12, essence: 1_400, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 13, essence: 1_800, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 14, essence: 2_400, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 15, essence: 3_300, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 16, essence: 4_450, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 17, essence: 6_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 18, essence: 8_050, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 19, essence: 10_450, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 20, essence: 15_250, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 21, essence: 16_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 22, essence: 20_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 23, essence: 24_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 24, essence: 28_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 25, essence: 32_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 26, essence: 36_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 27, essence: 40_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 28, essence: 44_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 29, essence: 48_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 30, essence: 52_000, spinel: 0, crystal: 0, arcaneCore: 0 },

  { level: 31, essence: 56_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 32, essence: 60_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 33, essence: 64_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 34, essence: 68_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 35, essence: 72_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 36, essence: 76_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 37, essence: 80_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 38, essence: 84_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 39, essence: 88_000, spinel: 0, crystal: 0, arcaneCore: 0 },
  { level: 40, essence: 92_000, spinel: 0, crystal: 0, arcaneCore: 0 },
];
/** Shared essence/spinel/crystal curve for Gear, Runes, Totems and Holystones (Lv. 1–40). */
export function upgradeTable(kind: 'gear' | 'rune' | 'totem' | 'holystone'): UpgradeCostRow[] {
  if (kind === 'rune') return runeUpgradeCosts;
  if (kind === 'totem') return totemUpgradeCosts;
  const mult = { gear: 1, rune: 1.2, totem: 1.5, holystone: 2 }[kind];
  return Array.from({ length: 40 }, (_, i) => {
    const level = i + 1;
    return {
      level,
      essence: Math.round(mult * (10 + level * level * 2.5)),
      spinel: level % 5 === 0 ? Math.round(mult * level * 1.5) : undefined,
      crystal: level % 10 === 0 ? Math.round(mult * level * 0.4) : undefined,
      arcaneCore: kind !== 'gear' && level >= 30 && level % 5 === 0 ? Math.round((level - 25) / 5) : undefined,
    };
  });
}

export const runeSets: RuneSet[] = [
  { name: 'Strength', focus: 'Infantry', stats: ['Infantry ATK', 'Infantry DEF', 'Infantry HP', 'Infantry Lethality'] },
  { name: 'Accuracy', focus: 'Archer', stats: ['Archer ATK', 'Archer DEF', 'Archer HP', 'Archer Lethality'] },
  { name: 'Charge', focus: 'Cavalry', stats: ['Cavalry ATK', 'Cavalry DEF', 'Cavalry HP', 'Cavalry Lethality'] },
  { name: 'Troop', focus: 'All', stats: ['Troop ATK', 'Troop DEF', 'Troop HP', 'Troop Lethality'] },
  { name: 'Troop II', focus: 'All', stats: ['Troop ATK', 'Troop HP', 'March size', 'Rally capacity'] },
  { name: 'Troop III', focus: 'All', stats: ['Troop DEF', 'Troop HP', 'Wounded reduction', 'Healing speed'] },
];

export const runeExtras = [
  { name: 'Magic Infusion', detail: 'Adds a bonus stat line; higher rune quality increases the infusion roll ceiling.' },
  { name: 'Modification', detail: 'Rerolls a sub-stat. Probability of a same-troop-type roll is roughly 1 in 4 per attempt.' },
];

export const totemSets: TotemSet[] = [
  { set: 'I', forgeLevel: 16, bear: 'Infantry HP', eagle: 'Archer ATK', wolf: 'Cavalry ATK' },
  { set: 'II', forgeLevel: 20, bear: 'Infantry DEF', eagle: 'Archer HP', wolf: 'Cavalry HP' },
  { set: 'III', forgeLevel: 24, bear: 'Infantry ATK', eagle: 'Archer DEF', wolf: 'Cavalry DEF' },
  { set: 'IV', forgeLevel: 28, bear: 'Infantry Lethality', eagle: 'Archer Lethality', wolf: 'Cavalry Lethality' },
  { set: 'V', forgeLevel: 31, bear: 'Infantry all stats', eagle: 'Archer all stats', wolf: 'Cavalry all stats' },
];

export const totemEnergyTiers = ['Common Energy Stone (1 line)', 'Fine Energy Stone (2 lines)', 'Superior Energy Stone (3 lines)', 'Arcane Energy Stone (4 lines + lock)'];

export const holystoneSets: HolystoneSet[] = [
  { set: 'I', forgeLevel: 25, unitStat: 'Unit ATK', troopStat: 'Troop HP' },
  { set: 'II', forgeLevel: 27, unitStat: 'Unit DEF', troopStat: 'Troop ATK' },
  { set: 'III', forgeLevel: 29, unitStat: 'Unit HP', troopStat: 'Troop DEF' },
  { set: 'IV', forgeLevel: 31, unitStat: 'Unit Lethality', troopStat: 'Troop Lethality' },
];

export const draconicStones: DraconicStone[] = [
  { name: 'Fiery', dragonLevel: 30, effect: 'Cavalry ATK', focus: 'Cavalry' },
  { name: 'Frigid / Frost', dragonLevel: 30, effect: 'Infantry DEF', focus: 'Infantry' },
  { name: 'Hurricane', dragonLevel: 30, effect: 'Archer ATK', focus: 'Archer' },
  { name: 'Lightning', dragonLevel: 30, effect: 'Troop Lethality', focus: 'All' },
  { name: 'Meteor', dragonLevel: 30, effect: 'Siege damage', focus: 'All' },
  { name: 'Water / Hydro', dragonLevel: 30, effect: 'Troop HP', focus: 'All' },
  { name: 'Nature', dragonLevel: 40, effect: 'Wounded reduction & healing', focus: 'All' },
  { name: 'Wild', dragonLevel: 50, effect: 'All troop ATK/DEF/HP', focus: 'All' },
];

export const dragonLair: DragonLairRow[] = Array.from({ length: 40 }, (_, i) => {
  const level = i + 1;
  const pct = Math.round(0.5 * level * 10) / 10;
  return { level, militaryReduction: pct, civilReduction: pct };
});

export const dragonExpItems = [
  { name: 'Holy Water (small)', exp: 100 },
  { name: 'Holy Water (medium)', exp: 1000 },
  { name: 'Holy Water (large)', exp: 10000 },
  { name: 'Dragon Shard', exp: 500 },
];

export const gloryBuildings: GloryBuilding[] = [
  { building: 'Citadel', stat: 'Troop ATK', focus: 'All' },
  { building: 'Wall', stat: 'Troop DEF', focus: 'All' },
  { building: 'Medical Tent', stat: 'Troop HP', focus: 'All' },
  { building: 'Lookout', stat: 'Troop HP', focus: 'All' },
  { building: 'Weapon Forge', stat: 'Troop Lethality', focus: 'All' },
  { building: 'Vehicle Workshop', stat: 'Troop ATK', focus: 'All' },
  { building: 'Archer Camp', stat: 'Archer ATK', focus: 'Archer' },
  { building: 'Institute', stat: 'Archer DEF', focus: 'Archer' },
  { building: 'Posthouse', stat: 'Archer HP', focus: 'Archer' },
  { building: 'Cavalry Camp', stat: 'Cavalry ATK', focus: 'Cavalry' },
  { building: 'War Hall', stat: 'Cavalry DEF', focus: 'Cavalry' },
  { building: 'Warehouse', stat: 'Cavalry HP', focus: 'Cavalry' },
  { building: 'Infantry Camp', stat: 'Infantry ATK', focus: 'Infantry' },
  { building: 'Embassy', stat: 'Infantry DEF', focus: 'Infantry' },
];
