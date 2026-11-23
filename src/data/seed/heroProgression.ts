/**
 * Hero progression rules from the community wiki (Heroes, Hero level up, Hero Bond, Hero Specialty
 * pages), checked 2026-11-23. Values marked "not verified" are gaps in the source, not guesses.
 */
export const HERO_PROGRESSION_SOURCES = [
  'https://puzzles-chaos.fandom.com/wiki/Heroes',
  'https://puzzles-chaos.fandom.com/wiki/Hero_level_up',
  'https://puzzles-chaos.fandom.com/wiki/Hero_Bond',
  'https://puzzles-chaos.fandom.com/wiki/Hero_Specialty',
];

/** Level cap by current star count. 2★ cap is not given by the source. */
export const LEVEL_CAP_BY_STARS: Record<number, number | null> = { 2: null, 3: 130, 4: 210, 5: 310, 6: 400 };
/** Highest level the app accepts when a cap is unknown. */
export const ABSOLUTE_MAX_LEVEL = 400;

/** Shards for each enhancement step: index 0 = obtaining the hero (Hero0), 1 = +0→+1 … 8 = +7→+8. Total 1,050. */
export const ENHANCEMENT_SHARDS = [10, 10, 20, 35, 50, 75, 150, 200, 500] as const;
/** Heroes below 5 stars can only reach +5. */
export const MAX_ENHANCEMENT_BELOW_5_STARS = 5;
export const MAX_ENHANCEMENT = 8;

/** 5★ → 6★ promotion. */
export const PROMOTION = { fromStars: 5, toStars: 6, level: 310, enhancement: 5, heroExp: 500_000, t6Books: 2_000 } as const;

/** Hero Specialty unlocks at +8 enhancement and level 350. */
export const SPECIALTY = { enhancement: 8, level: 350 } as const;

/** Levels at which hero (match-3) skills and troop skills unlock. */
export const SKILL_UNLOCK_LEVELS = [
  { level: 11, what: 'Second hero skill' },
  { level: 31, what: 'Third hero skill and first troop/civil skills' },
  { level: 71, what: 'Fourth hero skill' },
  { level: 131, what: 'Higher troop/civil skills (e.g. Troop Capacity, Rally Size)' },
] as const;

/** Total Hero EXP needed inside each level bracket (wiki summary table). Earlier brackets are not given. */
export const LEVEL_BRACKET_EXP = [
  { from: 71, to: 130, exp: 838_475 },
  { from: 131, to: 210, exp: 1_748_279 },
  { from: 211, to: 310, exp: 11_215_829 },
] as const;

/** Minimum enhancement for each band of bond levels. Levels 87+ are not given by the source. */
export const BOND_ENHANCEMENT_GATES = [
  { maxBond: 5, enhancement: 0 },
  { maxBond: 10, enhancement: 1 },
  { maxBond: 20, enhancement: 2 },
  { maxBond: 30, enhancement: 3 },
  { maxBond: 40, enhancement: 4 },
  { maxBond: 55, enhancement: 5 },
  { maxBond: 75, enhancement: 6 },
  { maxBond: 86, enhancement: 7 },
] as const;
