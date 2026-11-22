import type { BondGift, BondGroup, BondLevel, CurioStarCost, Curio } from '@/types/game';

/** Bond titles change every 10 levels; EXP requirement grows with each band. */
const bondTitles: { from: number; title: string; base: number; step: number; bonus: string }[] = [
  { from: 1, title: 'Stranger', base: 100, step: 20, bonus: 'Hero HP +0.5% per level' },
  { from: 11, title: 'Acquaintance', base: 400, step: 40, bonus: 'Hero ATK +0.5% per level' },
  { from: 21, title: 'Companion', base: 900, step: 80, bonus: 'Hero DEF +0.5% per level' },
  { from: 31, title: 'Friend', base: 1800, step: 120, bonus: 'Skill damage +0.3% per level' },
  { from: 41, title: 'Trusted Friend', base: 3200, step: 200, bonus: 'Mana gain +0.2% per level' },
  { from: 51, title: 'Ally', base: 5400, step: 300, bonus: 'Hero HP +0.8% per level' },
  { from: 61, title: 'Sworn Ally', base: 8600, step: 400, bonus: 'Hero ATK +0.8% per level' },
  { from: 71, title: 'Kindred', base: 13000, step: 600, bonus: 'Skill damage +0.5% per level' },
  { from: 81, title: 'Confidant', base: 19000, step: 900, bonus: 'Legion stats +0.2% per level' },
];

export const bondLevels: BondLevel[] = Array.from({ length: 90 }, (_, i) => {
  const level = i + 1;
  const band = [...bondTitles].reverse().find((b) => level >= b.from) ?? bondTitles[0]!;
  return { level, title: band.title, expToNext: band.base + band.step * (level - band.from), bonus: band.bonus };
});

export const bondGifts: BondGift[] = [
  { tier: 1, name: 'Wildflower Posy', exp: 10 },
  { tier: 2, name: 'Silver Locket', exp: 50 },
  { tier: 3, name: 'Enchanted Music Box', exp: 200 },
  { tier: 4, name: 'Starlit Tiara', exp: 1000 },
  { tier: 5, name: 'Heart of the Citadel', exp: 5000 },
];

export const bondGroups: BondGroup[] = [
  {
    id: 'sanguine-serenade', name: 'Sanguine Serenade', members: ['valerius', 'eris', 'lylia', 'echo'],
    bonuses: [{ level: 10, effect: 'Members ATK +3%' }, { level: 30, effect: 'Members crit damage +5%' }, { level: 60, effect: 'Dark & Fire damage +4%' }],
  },
  {
    id: 'octet-wanderers', name: 'Octet Wanderers', members: ['maxim', 'boyd', 'kanye', 'rodriguez', 'wu-kong', 'leona', 'patty', 'basilong'],
    bonuses: [{ level: 10, effect: 'Members HP +3%' }, { level: 30, effect: 'Members ATK +4%' }, { level: 60, effect: 'Fire damage +5%' }],
  },
  {
    id: 'rhapsody-of-genesis', name: 'Rhapsody of Genesis', members: ['khaos', 'anastasia', 'aerposia', 'angelita', 'saya'],
    bonuses: [{ level: 10, effect: 'Members DEF +3%' }, { level: 30, effect: 'Members skill damage +4%' }, { level: 60, effect: 'Legion ATK/DEF/HP +1%' }],
  },
  {
    id: 'tidal-court', name: 'Tidal Court', members: ['neptune', 'kaira', 'sea-goddess', 'kaios'],
    bonuses: [{ level: 10, effect: 'Members mana gain +3%' }, { level: 30, effect: 'Ice damage +4%' }, { level: 60, effect: 'Freeze duration +1 turn (PvE)' }],
  },
  {
    id: 'lucky-hearts', name: 'Lucky Hearts', members: ['basilong', 'edmund', 'aurora', 'freya', 'eric'],
    bonuses: [{ level: 10, effect: 'Members HP +3%' }, { level: 30, effect: 'Members ATK +3%' }, { level: 60, effect: 'Arena damage +3%' }],
  },
];

/** Curio ascension: Weapon Forge Lv. 20 unlocks curios. */
export const curioStarCosts: CurioStarCost[] = [
  { star: 1, spinel: 10, crystal: 0, unlocks: 'Legion Passive I' },
  { star: 2, spinel: 20, crystal: 0, unlocks: 'Hero Attribute +5%' },
  { star: 3, spinel: 40, crystal: 5, unlocks: 'Legion Passive II' },
  { star: 4, spinel: 60, crystal: 10, unlocks: 'Hero Attribute +10%' },
  { star: 5, spinel: 90, crystal: 20, unlocks: 'Exclusive Hero Passive' },
  { star: 6, spinel: 120, crystal: 35, unlocks: 'Legion Passive III' },
  { star: 7, spinel: 160, crystal: 50, unlocks: 'Hero Attribute +15%' },
  { star: 8, spinel: 200, crystal: 70, unlocks: 'Exclusive Passive enhanced' },
  { star: 9, spinel: 250, crystal: 95, unlocks: 'Legion Passive IV' },
  { star: 10, spinel: 320, crystal: 125, unlocks: 'Hero Attribute +20% (Max)' },
];

export const curios: Curio[] = [
  { id: 'azure-dragon-blade', name: 'Azure Dragon Blade', heroId: 'guan-yu', legionPassive: 'Cavalry ATK +2% to +8%', heroAttribute: 'Guan Yu ATK +5% to +20%', exclusivePassive: 'Azure Dragon Sweep stun extends to 2 turns' },
  { id: 'riftbreaker-lance', name: 'Riftbreaker Lance', heroId: 'khaos', legionPassive: 'Cavalry Lethality +2% to +8%', heroAttribute: 'Khaos ATK +5% to +20%', exclusivePassive: 'Abyssal Collapse ignores 20% DEF' },
  { id: 'rimecrown-sceptre', name: 'Rimecrown Sceptre', heroId: 'anastasia', legionPassive: 'Infantry DEF +2% to +8%', heroAttribute: 'Anastasia HP +5% to +20%', exclusivePassive: 'Glacial Coronation shield +30%' },
  { id: 'ember-codex', name: 'Ember Codex', legionPassive: 'Archer ATK +2% to +8%', heroAttribute: 'Fire heroes ATK +3% to +12%' },
  { id: 'warden-horn', name: "Warden's Horn", legionPassive: 'Troop HP +1% to +5%', heroAttribute: 'All heroes HP +3% to +12%' },
  { id: 'frost-compass', name: 'Frost Compass', legionPassive: 'March speed +2% to +8%', heroAttribute: 'Ice heroes mana gain +2% to +8%' },
];

export const elementWheel = {
  cycle: ['Fire', 'Nature', 'Ice'] as const,
  description: 'Fire beats Nature, Nature beats Ice, Ice beats Fire. Light and Dark deal bonus damage to each other.',
  advantage: 1.3,
};

export const troopTriangle = {
  cycle: ['Infantry', 'Archer', 'Cavalry'] as const,
  description: 'Infantry beats Archer, Archer beats Cavalry, Cavalry beats Infantry.',
  formations: [
    { name: 'Infantry Formation', unlock: 'Institute Lv. 28', effect: 'Infantry DEF/HP up while Infantry is at least 50% of the march.' },
    { name: 'Cavalry Formation', unlock: 'Institute Lv. 28', effect: 'Cavalry ATK up while Cavalry is at least 50% of the march.' },
    { name: 'Archer Formation', unlock: 'Institute Lv. 28', effect: 'Archer ATK/Lethality up while Archers are at least 50% of the march.' },
  ],
};
