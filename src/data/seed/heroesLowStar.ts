import type { AcquisitionSource, CivilSkill, Element, Hero, HeroAuditField, HeroSkill, Match3Skill, Rarity, UnitType } from '@/types/game';

/**
 * 2-, 3- and 4-star heroes from the Puzzles & Chaos community wiki (Heroes, Infantry, Cavalry, Archer,
 * Civil and Hero Plaza pages), checked 2026-11-23 through search-engine extracts. Only facts the wiki
 * lists are included: no titles, combat roles or invented skills. Stat skills list the stat only;
 * per-level values are not verified unless quoted.
 */
const W = 'https://puzzles-chaos.fandom.com/wiki/';
const HEROES = `${W}Heroes`;
const PLAZA = `${W}Hero_Plaza`;
const UNIT_PAGE: Record<UnitType, string> = {
  Infantry: `${W}Infantry`, Cavalry: `${W}Cavalry`, Archer: `${W}Archer`, 'All-round': `${W}All-round`, Civil: `${W}Civil`,
};

const stat = (name: string): HeroSkill => ({ name, description: 'Troop stat bonus listed on the wiki. Value not verified.' });
const civil = (name: string, description = 'Listed on the wiki. Value not verified.', requirement = 'Unlock level not verified'): CivilSkill =>
  ({ name, description, requirement });

interface LowStarInput {
  name: string;
  element: Element;
  rarity: Rarity;
  unit: UnitType;
  sources: AcquisitionSource[];
  march?: string[];
  civil?: CivilSkill[];
  m3?: Match3Skill;
  /** false when the element was inferred from the wiki table layout rather than stated. */
  elementStated?: boolean;
  bonds?: string[];
  notes?: string[];
  pages?: string[];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function lowStar(i: LowStarInput): Hero {
  const verified: HeroAuditField[] = ['name', 'rarity', 'unitType', 'sources'];
  if (i.elementStated !== false) verified.push('element');
  if (i.march?.length) verified.push('marchSkills');
  if (i.civil?.length) verified.push('civilSkills');
  if (i.m3) verified.push('match3Skill');
  if (i.bonds?.length) verified.push('bondGroups');
  const id = slug(i.name);
  return {
    id,
    name: i.name,
    title: '',
    element: i.element,
    rarity: i.rarity,
    unitType: i.unit,
    role: '',
    marchSkills: (i.march ?? []).map(stat),
    civilSkills: i.civil ?? [],
    match3Skill: i.m3,
    sources: i.sources,
    bondGroups: i.bonds ?? [],
    notes: '',
    confidence: 'community',
    audit: {
      checkedOn: '2026-11-23',
      verified,
      sourceUrls: [HEROES, UNIT_PAGE[i.unit], ...(i.pages ?? []), `${W}${encodeURIComponent(i.name.replace(/ /g, '_'))}`],
      notes: [
        `Added from the wiki: ${i.rarity}-star ${i.element} ${i.unit}.`,
        ...(i.elementStated === false ? ['Element inferred from the wiki Heroes table layout; not stated on a hero page.'] : []),
        ...(i.notes ?? []),
      ],
    },
  };
}

const PLAZA_EPIC: AcquisitionSource[] = ['Hero Plaza', 'Epic Hero Covenant'];
const PLAZA_SUPERB: AcquisitionSource[] = ['Hero Plaza', 'Superb Hero Covenant'];

export const lowStarHeroes: Hero[] = [
  // ------------------------------ Fire ------------------------------
  lowStar({ name: 'Baron', element: 'Fire', rarity: 2, unit: 'Archer', sources: ['Hero Plaza'], march: ['Archer DEF', 'Archer ATK'], civil: [civil('Wood Output')] }),
  lowStar({ name: 'Lucia', element: 'Fire', rarity: 3, unit: 'Civil', sources: ['Hero Plaza', 'Superb Hero Covenant', 'Monsters', 'Monster Dens'], pages: [PLAZA],
    civil: [civil('Training Capacity'), civil('Research Stone Cost'), civil('Research Iron Cost')], notes: ['Sold for 50 points in the Hero Plaza point shop.'] }),
  lowStar({ name: 'Tulios', element: 'Fire', rarity: 3, unit: 'Civil', sources: ['Hero Plaza'], pages: [PLAZA],
    civil: [civil('Iron Gather Speed'), civil('Hunt March Speed'), civil('Hunt ATK Bonus')] }),
  lowStar({ name: 'Capos', element: 'Fire', rarity: 4, unit: 'Cavalry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'],
    m3: { name: 'Override', description: 'Deals 235% damage to the target and adjacent enemies. Skill level for this value not stated.', pattern: 'Target + adjacent', effects: ['Damage'] } }),
  lowStar({ name: 'Tooka', element: 'Fire', rarity: 4, unit: 'Infantry', sources: ['Hero Plaza', 'Epic Hero Covenant', 'Royal Shop'], march: ['Troop HP', 'Troop DEF', 'Troop ATK'],
    notes: ['Wiki lists Troop ATK scaling of about 3.2% to 16%, unlocking at level 131; tier mapping not verified.', 'Separate "Infernal Tooka" variant on the Civil page is not included.'] }),
  // ------------------------------ Ice ------------------------------
  lowStar({ name: 'Sophia', element: 'Ice', rarity: 2, unit: 'Cavalry', sources: ['Hero Plaza'], march: ['Cavalry DEF', 'Cavalry ATK'], civil: [civil('Stone Output')] }),
  lowStar({ name: 'Ada', element: 'Ice', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Infantry HP', 'Infantry DEF', 'Infantry ATK'] }),
  lowStar({ name: 'Axel', element: 'Ice', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Gather Speed')] }),
  lowStar({ name: 'Andre', element: 'Ice', rarity: 4, unit: 'Infantry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Output')] }),
  lowStar({ name: 'Odell', element: 'Ice', rarity: 4, unit: 'Civil', sources: ['Epic Hero Covenant', 'Monsters', 'Monster Dens'],
    civil: [civil('Lord EXP Bonus'), civil('Medical Tent Healing Speed'), civil('Troop Capacity')], notes: ['Monsters Lv. 10+ and Monster dens Lv. 8–9 per the wiki.'] }),
  lowStar({ name: 'Viola', element: 'Ice', rarity: 4, unit: 'Infantry', sources: ['Hero Plaza'], march: ['Troop HP', 'Troop DEF', 'Troop ATK'], notes: ['Element confirmed by the in-game hero card (wiki only implies it by table position).'] }),
  // ------------------------------ Nature ------------------------------
  lowStar({ name: 'Luke', element: 'Nature', rarity: 2, unit: 'Infantry', sources: ['Hero Plaza'], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Output')] }),
  lowStar({ name: 'Gerolin', element: 'Nature', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza', 'Superb Hero Covenant', 'Royal Shop', 'Arena Reward Chest'], pages: [PLAZA],
    march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Gather Speed')] }),
  lowStar({ name: 'Roger', element: 'Nature', rarity: 3, unit: 'Archer', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Archer DEF', 'Archer ATK'], civil: [civil('Wood Gather Speed')] }),
  lowStar({ name: 'Cassandra', element: 'Nature', rarity: 4, unit: 'Civil', sources: ['Mesdi Portal'],
    civil: [civil('Gather March Speed'), civil('Hunt March Speed'), civil('Troop Capacity')], notes: ['Obtained from Mesdi Portal World II.'] }),
  lowStar({ name: 'Dolly', element: 'Nature', rarity: 4, unit: 'Archer', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Archer HP', 'Archer DEF', 'Archer ATK'] }),
  lowStar({ name: 'Wallace', element: 'Nature', rarity: 4, unit: 'Infantry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Infantry HP', 'Infantry DEF', 'Infantry ATK'] }),
  lowStar({ name: 'Schubert', element: 'Nature', rarity: 4, unit: 'Civil', sources: ['Combination Event'],
    civil: [civil('Training Speed'), civil('Stone Output'), civil('Rally Size')] }),
  lowStar({ name: 'Ysera', element: 'Nature', rarity: 4, unit: 'Cavalry', sources: PLAZA_EPIC, march: ['Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'] }),
  // ------------------------------ Light ------------------------------
  lowStar({ name: 'Penny', element: 'Light', rarity: 2, unit: 'Civil', sources: ['Hero Plaza'],
    civil: [civil('Hunt March Speed'), civil('Research Food Cost'), civil('Research Wood Cost')] }),
  lowStar({ name: 'Aemon', element: 'Light', rarity: 3, unit: 'Archer', sources: PLAZA_SUPERB, pages: [PLAZA], march: ['Archer HP', 'Archer DEF', 'Archer ATK'] }),
  lowStar({ name: 'Hannah', element: 'Light', rarity: 3, unit: 'Cavalry', sources: PLAZA_SUPERB, pages: [PLAZA], march: ['Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'],
    m3: { name: 'Valiant Throw', description: 'Deals 208% damage to the target and adjacent enemies. Skill level for this value not stated.', pattern: 'Target + adjacent', effects: ['Damage'] } }),
  lowStar({ name: 'Christina', element: 'Light', rarity: 4, unit: 'Cavalry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'],
    notes: ['The wiki Civil page also lists Christina among heroes with a Civil skill, but the Cavalry table shows three stat skills. Not resolved.'] }),
  lowStar({ name: 'Hanzo', element: 'Light', rarity: 4, unit: 'Archer', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Archer DEF', 'Archer ATK'], civil: [civil('Wood Output')] }),
  // ------------------------------ Dark ------------------------------
  lowStar({ name: 'Claudia', element: 'Dark', rarity: 3, unit: 'Cavalry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Cavalry DEF', 'Cavalry ATK'], civil: [civil('Stone Gather Speed')],
    notes: ['Sold for 50 points in the Hero Plaza point shop.', 'Element confirmed by the in-game hero card (wiki only implies it by table position).'] }),
];

/**
 * 5- and 6-star heroes added 2026-11-23 after they appeared in an in-game hero list; element, stars and
 * unit type match both the wiki Heroes table and the in-game cards. Only wiki-listed skills are included.
 */
export const addedHighStarHeroes: Hero[] = [
  lowStar({ name: 'Sodoma', element: 'Nature', rarity: 5, unit: 'Cavalry', sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Timeless Recruitment', 'Recruit Trial'],
    bonds: ['Octet Wanderers'], pages: [`${W}Hero_Bond`] }),
  lowStar({ name: 'Setemos', element: 'Dark', rarity: 5, unit: 'Civil', sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Recruit Trial'],
    civil: [civil('Hunt ATK Bonus', 'Listed on the wiki. Value not verified.', 'Unlocks at level 31'), civil('Troop DEF', 'Listed on the wiki. Value not verified.', 'Unlocks at level 131')],
    bonds: ['Sanguine Serenade'], pages: [`${W}Hero_Bond`] }),
  lowStar({ name: 'Tutanhet', element: 'Fire', rarity: 5, unit: 'Archer', sources: ['Mythic Hero Covenant', 'Timeless Recruitment', 'Recruit Trial', 'Monsters', 'Monster Dens'], pages: [PLAZA],
    notes: ['Also sold for 1,000 points in the Hero Plaza point shop; shards drop from Monster den supply chests.'] }),
  lowStar({ name: 'Sirona', element: 'Dark', rarity: 5, unit: 'Civil', sources: ['Timeless Recruitment', 'Recruit Trial', 'Trial Turret Shop'],
    civil: [civil('Troop Capacity', 'Listed on the wiki. Value not verified.', 'Unlocks at level 131')],
    bonds: ['Octet Wanderers'], pages: [`${W}Hero_Bond`, `${W}Troop_Capacity`] }),
  lowStar({ name: 'Isabella', element: 'Nature', rarity: 6, unit: 'Civil', sources: [],
    notes: ['The wiki lists no acquisition method.'] }),
];

