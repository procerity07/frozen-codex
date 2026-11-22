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

/** Rotating second prerequisite for each Citadel level (Wall at L-1 is always required). */
const rotation = ['institute', 'archer-camp', 'medical-tent', 'infantry-camp', 'embassy', 'cavalry-camp', 'weapon-forge', 'lookout', 'warehouse', 'war-hall', 'vehicle-workshop', 'mesdi-portal', 'posthouse', 'furnace', 'quarry', 'lumberyard'];
const nameOf = (id: string) => buildings.find((b) => b.id === id)?.name ?? id;

const unlockNotes: Record<number, string[]> = {
  6: ['Lich Attack', 'Weapon Forge'], 10: ['Fort Contest', 'War Hall'], 12: ['Sanctuary'], 15: ['Glory Levels', 'Alliance Showdown'],
  16: ['Totem Set I'], 20: ['Curios', 'Rune Set V'], 25: ['Holystone Set I', 'Ancient Tomes'], 28: ['Institute Formations'], 30: ['Astronomy Tomes', 'T11 troops'],
  31: ['Totem Set V', 'Holystone Set IV'], 33: ['Glory Codex'], 35: ['T12 troops'], 37: ['Gold Statues'], 40: ['Max Citadel'],
};

function cost(level: number) {
  // Modelled growth curve (community estimate) — overwrite with verified values via the OTA pack.
  const base = Math.round(1200 * Math.pow(1.42, level - 1) / 100) * 100;
  return {
    food: base,
    wood: base,
    stone: level >= 5 ? Math.round(base * 0.6 / 100) * 100 : 0,
    iron: level >= 10 ? Math.round(base * 0.3 / 100) * 100 : 0,
    ancientTome: level >= 25 ? 20 * (level - 24) : undefined,
    astronomyTome: level >= 30 ? 15 * (level - 29) : undefined,
    gloryCodex: level >= 33 ? 5 * (level - 32) : undefined,
    goldStatue: level >= 37 ? 2 * (level - 36) : undefined,
  };
}

export const citadelLevels: CitadelLevel[] = Array.from({ length: 40 }, (_, i) => {
  const level = i + 1;
  const requires = level === 1 ? [] : [
    { building: 'Wall', level: level - 1 },
    { building: nameOf(rotation[(level - 2) % rotation.length]!), level: level - 1 },
    ...(level >= 20 ? [{ building: nameOf(rotation[(level + 5) % rotation.length]!), level: level - 1 }] : []),
  ];
  return {
    level,
    requires,
    cost: cost(level),
    baseSeconds: Math.round(30 * Math.pow(1.48, level - 1)),
    unlocks: unlockNotes[level] ?? [],
    confidence: 'estimate',
  };
});

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

/** Shared essence/spinel/crystal curve for Gear, Runes, Totems and Holystones (Lv. 1–40). */
export function upgradeTable(kind: 'gear' | 'rune' | 'totem' | 'holystone'): UpgradeCostRow[] {
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
