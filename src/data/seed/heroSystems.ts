import type { BondGift, BondGroup, BondLevel, CurioStarCost, Curio } from '@/types/game';

/**
 * Hero Bond levels 1–95 (community wiki Hero Bond page): Lv. 1 needs 1,000 EXP and Lv. 95 needs 330,000.
 * Levels in between are ESTIMATED by geometric interpolation between those two published points.
 * Each level also needs a minimum hero enhancement (e.g. Hero1 at Lv. 6, Hero6 at Lv. 56).
 * Titles: Stranger (Lv. 1) and Confidant (Lv. 80+) as supplied in the project brief; per-level bonuses are not verified.
 */
const BOND_MAX = 95;
const BOND_EXP_FIRST = 1000;
const BOND_EXP_LAST = 330000;
export const bondLevels: BondLevel[] = Array.from({ length: BOND_MAX }, (_, i) => {
  const level = i + 1;
  const exp = Math.round((BOND_EXP_FIRST * Math.pow(BOND_EXP_LAST / BOND_EXP_FIRST, i / (BOND_MAX - 1))) / 100) * 100;
  return { level, title: level >= 80 ? 'Confidant' : level === 1 ? 'Stranger' : '', expToNext: level === 1 ? BOND_EXP_FIRST : level === BOND_MAX ? BOND_EXP_LAST : exp, bonus: 'Not verified' };
});

/** Wiki Hero Bond page: EXP per gift level; same-element gifts give more. Gift names are not given. */
export const bondGifts: BondGift[] = [
  { tier: 1, name: 'Bond Gift I', exp: 100, sameElementExp: 200 },
  { tier: 2, name: 'Bond Gift II', exp: 500, sameElementExp: 1000 },
  { tier: 3, name: 'Bond Gift III', exp: 1000, sameElementExp: 2000 },
  { tier: 4, name: 'Bond Gift IV', exp: 5000, sameElementExp: 25000 },
  { tier: 5, name: 'Bond Gift V', exp: 10000, sameElementExp: 50000 },
];

// Membership of the first three groups follows the community wiki Hero Bond page
// (https://puzzles-chaos.fandom.com/wiki/Hero_Bond). Members not in this app's hero list are kept in otherMembers.
export const bondGroups: BondGroup[] = [
  {
    id: 'sanguine-serenade', name: 'Sanguine Serenade', members: ['norris', 'eris', 'carvell', 'edith'], otherMembers: ['Setemos'],
    verified: true, bonusesVerified: false,
    bonuses: [{ level: 0, effect: 'Favorability rewards boost Archer, Cavalry and Infantry stats (levels and values not verified)' }],
  },
  {
    id: 'octet-wanderers', name: 'Octet Wanderers', members: ['fiona', 'tania', 'apan'], otherMembers: ['Sodoma', 'Sirona'],
    verified: true, bonusesVerified: false,
    bonuses: [{ level: 40, effect: 'Cavalry ATK (value not verified)' }, { level: 70, effect: 'Infantry DEF (value not verified)' }, { level: 99, effect: 'Archer HP (value not verified)' }],
  },
  {
    id: 'rhapsody-of-genesis', name: 'Rhapsody of Genesis', members: ['edmund', 'rodriguez', 'kujo-mamoru', 'freya', 'saya'],
    verified: true, bonusesVerified: false,
    bonuses: [{ level: 10, effect: 'Members DEF +3%' }, { level: 30, effect: 'Members skill damage +4%' }, { level: 60, effect: 'Legion ATK/DEF/HP +1%' }],
  },
  {
    id: 'tidal-court', name: 'Tidal Court', members: ['neptune', 'kaira', 'sea-goddess', 'kaios'], verified: false, bonusesVerified: false,
    bonuses: [{ level: 10, effect: 'Members mana gain +3%' }, { level: 30, effect: 'Ice damage +4%' }, { level: 60, effect: 'Freeze duration +1 turn (PvE)' }],
  },
  {
    id: 'lucky-hearts', name: 'Lucky Hearts', members: ['basilong', 'edmund', 'aurora', 'freya', 'eric'], verified: false, bonusesVerified: false,
    bonuses: [{ level: 10, effect: 'Members HP +3%' }, { level: 30, effect: 'Members ATK +3%' }, { level: 60, effect: 'Arena damage +3%' }],
  },
];

/** Curio ascension: Weapon Forge Lv. 20 unlocks curios. */
/**
 * Curio ascension (wiki Curio page): 500 Spinel; then 2,000 Spinel + 100 Crystal; 5,000 + 200; 10,000 + 500.
 * The wiki ties the first step to five stars; the exact star each later step reaches is inferred. Unlocks per step not verified.
 */
export const curioStarCosts: CurioStarCost[] = [
  { star: 5, spinel: 500, crystal: 0, unlocks: 'Not verified' },
  { star: 6, spinel: 2000, crystal: 100, unlocks: 'Not verified' },
  { star: 7, spinel: 5000, crystal: 200, unlocks: 'Not verified' },
  { star: 8, spinel: 10000, crystal: 500, unlocks: 'Not verified' },
];

export const curios: Curio[] = [
  // Verified association and attribute types (wiki Guan Yu and Curio pages); per-level values beyond those quoted are not verified.
  { id: 'azure-dragon-blade', name: 'Azure Dragon Blade', heroId: 'guan-yu', verified: true, legionPassive: 'Troop DEF, Troop HP and Troop ATK — up to +100% each at Legendary', heroAttribute: 'Not verified', exclusivePassive: 'Extra Troop ATK, up to +150% at the top tier' },
  { id: 'wings-of-icarus', name: 'Wings of Icarus', heroId: 'saya', verified: true, legionPassive: 'Troop DEF and Troop HP (values not verified)', heroAttribute: 'Not verified', exclusivePassive: 'Troop capacity — needs Saya at +4, and +6 for the second Legendary bonus' },
  // Not found in any source checked.
  { id: 'riftbreaker-lance', name: 'Riftbreaker Lance', heroId: 'khaos', verified: false, legionPassive: 'Cavalry Lethality +2% to +8%', heroAttribute: 'Khaos ATK +5% to +20%', exclusivePassive: 'Abyssal Collapse ignores 20% DEF' },
  { id: 'rimecrown-sceptre', name: 'Rimecrown Sceptre', heroId: 'anastasia', verified: false, legionPassive: 'Infantry DEF +2% to +8%', heroAttribute: 'Anastasia HP +5% to +20%', exclusivePassive: 'Glacial Coronation shield +30%' },
  { id: 'ember-codex', name: 'Ember Codex', verified: false, legionPassive: 'Archer ATK +2% to +8%', heroAttribute: 'Fire heroes ATK +3% to +12%' },
  { id: 'warden-horn', name: "Warden's Horn", verified: false, legionPassive: 'Troop HP +1% to +5%', heroAttribute: 'All heroes HP +3% to +12%' },
  { id: 'frost-compass', name: 'Frost Compass', verified: false, legionPassive: 'March speed +2% to +8%', heroAttribute: 'Ice heroes mana gain +2% to +8%' },
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
