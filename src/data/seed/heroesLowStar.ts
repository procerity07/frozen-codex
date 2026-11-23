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
  {
    ...lowStar({ name: 'Sirona', element: 'Dark', rarity: 5, unit: 'Civil', sources: ['Timeless Recruitment', 'Recruit Trial', 'Trial Turret Shop'],
      march: ['Troop skill'],
      civil: [
        { name: 'Resource Gather Speed', description: 'In-game. 5★: +12% at +2 up to +75% at +8; 6★: +37.5% at +5 up to +100% at +8.', requirement: 'Active while owned (in-game)', stat: 'gatherSpeed', unit: '%',
          tiers: { '5': [null, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
        { name: 'Medical Tent Healing Speed', description: 'In-game. 5★: +12% at +2 up to +75% at +8; 6★: +37.5% at +5 up to +100% at +8.', requirement: 'Active while owned (in-game)', stat: 'healSpeed', unit: '%',
          tiers: { '5': [null, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
        { name: 'Troop Capacity', description: 'In-game. 5★: +8,000 at +2 up to +37,500 at +8; 6★: +25,000 at +5 up to +50,000 at +8.', requirement: 'Unlocks at level 131 (as listed on the wiki)', stat: 'troopCap', unit: 'flat',
          tiers: { '5': [null, null, 8000, 12000, 16000, 20000, 25000, 30000, 37500], '6': [null, null, null, null, null, 25000, 32000, 33000, 50000] } },
      ],
      m3: { name: 'Silent Moon', description: 'Restores 44% HP to all allies (Rage Regen: Medium). Crescent Blessing: all allies +24% Rage Regen for 6 rounds. Healing Moonlight: restores 2% HP per round for 6 rounds. Lunatus Nirvana: a chance to Revive on death, once per battle. Iron Will (unlocks at 6★): Crit Res. +30%. Values as shown in-game at +2.', charge: 'Medium', pattern: 'All allies', effects: ['Heal', 'Rage up', 'Heal over time', 'Revive', 'Crit Res.'] },
      bonds: ['Octet Wanderers'], pages: [`${W}Hero_Bond`, `${W}Troop_Capacity`],
      notes: ['In-game (2026-11-23, Sirona at +2): 5★ Dark Civil confirmed; troop skill 150% of troop ATK; Resource Gather Speed, Medical Tent Healing Speed and Troop Capacity tables for 5★ and 6★; five hero skills.'] }),
    marchSkills: [{ name: 'Troop skill', description: 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).' }],
  },
  {
    ...lowStar({ name: 'Isabella', element: 'Nature', rarity: 6, unit: 'Civil', sources: [],
      march: ['Troop skill'],
      civil: [
      { name: 'Troop HP (Passive)', description: 'In-game, applies to all troops while you own her. 6★: +15% at +1, +21% at +2 up to +200% at +8; 7★: +80% at +5 up to +250% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '6': [null, 15, 21, 31, 41, 64, 82, 120, 200], '7': [null, null, null, null, null, 80, 102.5, 150, 250] } },
      { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops while you own her. 6★: +15% at +1, +21% at +2 up to +200% at +8; 7★: +80% at +5 up to +250% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '6': [null, 15, 21, 31, 41, 64, 82, 120, 200], '7': [null, null, null, null, null, 80, 102.5, 150, 250] } },
      { name: 'Troop ATK (Passive)', description: 'In-game, applies to all troops while you own her. 6★: +15% at +1, +21% at +2 up to +200% at +8; 7★: +80% at +5 up to +250% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '6': [null, 15, 21, 31, 41, 64, 82, 120, 200], '7': [null, null, null, null, null, 80, 102.5, 150, 250] } },
      ],
      m3: { name: 'Blessing of Vitality', description: 'Restores 54% HP to all allies (Rage Regen: Medium). Blessing of Courage: all allies +100% ATK for 5 rounds. Blessing of Resolve: all allies +64% DEF for 5 rounds. Blessing of Faith: all allies +24% Rage recovery for 5 rounds. Blessing of Glory (unlocks at 7★): all allies +30% Crit for 5 rounds. Values as shown in-game at +1.', charge: 'Medium', pattern: 'All allies', effects: ['Heal', 'ATK up', 'DEF up', 'Rage up', 'Crit'] },
      notes: ['The wiki lists no acquisition method.', 'In-game (2026-11-23, Isabella at +1, S3 badge): 6★ Nature Civil confirmed; troop skill 120% of troop ATK at +1; Troop HP/DEF/ATK passives apply to all troops while owned (6★ and 7★ tables); five hero skills (Blessing of Vitality, Courage, Resolve, Faith, and Glory at 7★). She can be promoted to 7★; the 7★ rules are not in the app yet.'] }),
    marchSkills: [{ name: 'Troop skill', description: 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).' }],
  },
];

