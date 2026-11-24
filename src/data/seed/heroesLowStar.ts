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
  {
    ...lowStar({ name: 'Tooka', element: 'Fire', rarity: 4, unit: 'Infantry', sources: ['Hero Plaza', 'Epic Hero Covenant', 'Royal Shop'], march: ['Troop skill', 'Troop HP', 'Troop DEF', 'Troop ATK'],
      m3: { name: 'Warlord of Hellfire', description: 'Deals 149% damage to all enemies (Rage Regen: Slow). Dread Howl: enemies ATK −28% for 5 rounds. Retaliation: ATK +15% and Crit +8%. Commander-in-chief (unlocks Lv. 71): all allies ATK +34% for 5 rounds. Values as shown in-game at +2.', charge: 'Slow', pattern: 'All enemies', effects: ['ATK down', 'ATK up', 'Crit'] },
      notes: ['In-game (2026-11-23, Tooka at +2): 4★ Fire Infantry confirmed; troop skill 150% of troop ATK; Troop HP/DEF/ATK 6.4/9.6/12.8/16% (+2 to +5), Troop ATK unlocks at Lv. 131; four hero skills.', 'Separate "Infernal Tooka" variant on the Civil page is not included.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).' },
      { name: 'Troop HP', description: '4★: +6.4% at +2, +9.6% at +3, +12.8% at +4, +16% at +5. Applies to all troops when he joins troop battle (in-game).' },
      { name: 'Troop DEF', description: '4★: +6.4% at +2, +9.6% at +3, +12.8% at +4, +16% at +5. Applies to all troops when he joins troop battle (in-game).' },
      { name: 'Troop ATK', description: '4★: +6.4% at +2, +9.6% at +3, +12.8% at +4, +16% at +5. Applies to all troops when he joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
  // ------------------------------ Ice ------------------------------
  lowStar({ name: 'Sophia', element: 'Ice', rarity: 2, unit: 'Cavalry', sources: ['Hero Plaza'], march: ['Cavalry DEF', 'Cavalry ATK'], civil: [civil('Stone Output')] }),
  lowStar({ name: 'Ada', element: 'Ice', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Infantry HP', 'Infantry DEF', 'Infantry ATK'] }),
  lowStar({ name: 'Axel', element: 'Ice', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Gather Speed')] }),
  lowStar({ name: 'Andre', element: 'Ice', rarity: 4, unit: 'Infantry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Output')] }),
  {
    ...lowStar({ name: 'Odell', element: 'Ice', rarity: 4, unit: 'Civil', sources: ['Epic Hero Covenant', 'Monsters', 'Monster Dens'],
      march: ['Troop skill'],
      civil: [
        { name: 'Lord EXP Bonus', description: 'In-game. 4★: +12% at +2, +18% at +3, +24% at +4, +30% at +5.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '4': [null, null, 12, 18, 24, 30] } },
        { name: 'Medical Tent Healing Speed', description: 'In-game. 4★: +8% at +2, +12% at +3, +16% at +4, +20% at +5.', requirement: 'Active while owned (in-game)', stat: 'healSpeed', unit: '%', tiers: { '4': [null, null, 8, 12, 16, 20] } },
        { name: 'Troop Capacity', description: 'In-game. 4★: +4,000 at +2, +6,000 at +3, +8,000 at +4, +10,000 at +5.', requirement: 'Active while owned (in-game)', stat: 'troopCap', unit: 'flat', tiers: { '4': [null, null, 4000, 6000, 8000, 10000] } },
      ],
      m3: { name: 'Blindside', description: 'Deals 178% damage to all enemies (Rage Regen: Slow). Wild Roar: enemies ATK −28% for 5 rounds. Forest Dominator: ATK +15% and Dodge +6%. Ice Blade: enemies DEF −44% for 5 rounds. Values as shown in-game at +2.', charge: 'Slow', pattern: 'All enemies', effects: ['ATK down', 'DEF down', 'ATK up', 'Dodge'] },
      notes: ['Monsters Lv. 10+ and Monster dens Lv. 8–9 per the wiki.', 'In-game (2026-11-23, Odell at +2): 4★ Ice Civil confirmed; troop skill 150% of troop ATK; civil skill tables (+2 to +5); four hero skills.'] }),
    marchSkills: [{ name: 'Troop skill', description: 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).' }],
  },
  lowStar({ name: 'Viola', element: 'Ice', rarity: 4, unit: 'Infantry', sources: ['Hero Plaza'], march: ['Troop HP', 'Troop DEF', 'Troop ATK'], notes: ['Element confirmed by the in-game hero card (wiki only implies it by table position).'] }),
  // ------------------------------ Nature ------------------------------
  lowStar({ name: 'Luke', element: 'Nature', rarity: 2, unit: 'Infantry', sources: ['Hero Plaza'], march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Output')] }),
  lowStar({ name: 'Gerolin', element: 'Nature', rarity: 3, unit: 'Infantry', sources: ['Hero Plaza', 'Superb Hero Covenant', 'Royal Shop', 'Arena Reward Chest'], pages: [PLAZA],
    march: ['Infantry DEF', 'Infantry ATK'], civil: [civil('Food Gather Speed')] }),
  lowStar({ name: 'Roger', element: 'Nature', rarity: 3, unit: 'Archer', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Archer DEF', 'Archer ATK'], civil: [civil('Wood Gather Speed')] }),
  {
    ...lowStar({ name: 'Cassandra', element: 'Nature', rarity: 4, unit: 'Civil', sources: ['Mesdi Portal'], march: ['Troop skill'],
      civil: [
        { name: 'Gather March Speed', description: 'In-game. 4★: +4% at Hero0, then +10% at +2, +13% at +3, +17% at +4, +21% at +5.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '4': [4, null, 10, 13, 17, 21] } },
        { name: 'Hunt March Speed', description: 'In-game. 4★: +4% at Hero0, then +10% at +2, +13% at +3, +17% at +4, +21% at +5.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '4': [4, null, 10, 13, 17, 21] } },
        { name: 'Troop Capacity', description: 'In-game. 4★: +2,000 at Hero0, then +4,000 at +2 up to +10,000 at +5.', requirement: 'Unlocks at level 131 (in-game)', stat: 'troopCap', unit: 'flat', tiers: { '4': [2000, null, 4000, 6000, 8000, 10000] } },
      ],
      m3: { name: 'Death Thorn', description: 'Deals 196% damage to the target and adjacent enemies (Rage Regen: Medium). Spiked Armor: all allies DEF +46% for 5 rounds. Heart of Nature: ATK +15% and Crit +8%. Primal Instinct: Dodge +20%. Values as shown in-game at Hero0.', charge: 'Medium', pattern: 'Target + adjacent', effects: ['DEF up', 'ATK up', 'Crit', 'Dodge'] },
      notes: ['Obtained from Mesdi Portal World II.', 'In-game (2026-11-23, Cassandra at Hero0): 4★ Nature Civil confirmed; troop skill 100% of troop ATK; Gather/Hunt March Speed 4% (Hero0), 10/13/17/21% (+2 to +5); Troop Capacity 2,000 (Hero0), 4,000–10,000 (Lv. 131); four hero skills.'] }),
    marchSkills: [{ name: 'Troop skill', description: 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).' }],
  },
  {
    ...lowStar({ name: 'Dolly', element: 'Nature', rarity: 4, unit: 'Archer', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Troop skill', 'Archer HP', 'Archer DEF', 'Archer ATK'],
      m3: { name: "Nature's Cure", description: 'Restores 30% HP to all allies (Rage Regen: Medium). Eco Balance: dispels all buffs on enemies. Favor of Nature: ATK +15% and Crit +8%. Cosmos Blessing (unlocks Lv. 71): dispels all debuffs on allies. Values as shown in-game at +1.', charge: 'Medium', pattern: 'All allies', effects: ['Heal', 'Dispel', 'ATK up', 'Crit'] },
      notes: ['In-game (2026-11-23, Dolly at +1): 4★ Nature Archer confirmed; troop skill 120% of troop ATK; Archer HP/DEF/ATK 15/20/30/40/50% (+1 to +5), Archer ATK unlocks at Lv. 131; four hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).' },
      { name: 'Archer HP', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Archer DEF', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Archer ATK', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
  {
    ...lowStar({ name: 'Wallace', element: 'Nature', rarity: 4, unit: 'Infantry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Troop skill', 'Infantry HP', 'Infantry DEF', 'Infantry ATK'],
      m3: { name: 'Greatblade of Storm', description: 'Deals 300% damage to the target (Rage Regen: Fast). Keen Edge: the target takes 18% of ATK as Poison damage for 5 rounds. Heart of the Brave: ATK +15% and Rage Regen +8%. Freedom Fighter (unlocks Lv. 71): Dodge +20%. Values as shown in-game at +1.', charge: 'Fast', pattern: 'Single target', effects: ['Poison', 'ATK up', 'Rage up', 'Dodge'] },
      notes: ['In-game (2026-11-23, Wallace at +1): 4★ Nature Infantry confirmed; troop skill 120% of troop ATK; Infantry HP/DEF/ATK 15/20/30/40/50% (+1 to +5), Infantry ATK unlocks at Lv. 131; four hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).' },
      { name: 'Infantry HP', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when he joins troop battle (in-game).' },
      { name: 'Infantry DEF', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when he joins troop battle (in-game).' },
      { name: 'Infantry ATK', description: '4★: +15% at +1, +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when he joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
  lowStar({ name: 'Schubert', element: 'Nature', rarity: 4, unit: 'Civil', sources: ['Combination Event'],
    civil: [civil('Training Speed'), civil('Stone Output'), civil('Rally Size')] }),
  {
    ...lowStar({ name: 'Ysera', element: 'Nature', rarity: 4, unit: 'Cavalry', sources: PLAZA_EPIC, march: ['Troop skill', 'Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'],
      m3: { name: 'Vine Strike', description: 'Deals 186% damage to all enemies (Rage Regen: Medium). Guardian\'s Light: all allies +34% ATK for 5 rounds. Entangle: all enemies DEF −44% for 5 rounds. Nourish: all allies +24% Rage recovery for 5 rounds. Values as shown in-game at +4.', charge: 'Medium', pattern: 'All enemies', effects: ['ATK up', 'DEF down', 'Rage up'] },
      notes: ['In-game (2026-11-23, Ysera at +4): 4★ Nature Cavalry confirmed; troop skill 300% of troop ATK; Cavalry HP/DEF/ATK 20/30/40/50% (+2 to +5); four hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 300% of troop ATK to the enemy (at +4, in-game).' },
      { name: 'Cavalry HP', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Cavalry DEF', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Cavalry ATK', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
    ],
  },
  // ------------------------------ Light ------------------------------
  lowStar({ name: 'Penny', element: 'Light', rarity: 2, unit: 'Civil', sources: ['Hero Plaza'],
    civil: [civil('Hunt March Speed'), civil('Research Food Cost'), civil('Research Wood Cost')] }),
  {
    ...lowStar({ name: 'Aemon', element: 'Light', rarity: 3, unit: 'Archer', sources: PLAZA_SUPERB, pages: [PLAZA], march: ['Troop skill', 'Archer HP', 'Archer DEF', 'Archer ATK'],
      m3: { name: 'Dawn Break', description: 'Deals 316% damage to the target (Rage Regen: Fast). Light Cone (unlocks Lv. 11): target Hit −32% for 4 rounds. Blessed Light (unlocks Lv. 31): ATK +10% and Crit +5%. Values as shown in-game at +2.', charge: 'Fast', pattern: 'Single target', effects: ['Hit down', 'ATK up', 'Crit'] },
      notes: ['In-game (2026-11-24, Aemon at +2): 3★ Light Archer confirmed; troop skill 150/200/300/500% of troop ATK (+2 to +5); Archer HP/DEF/ATK 10/15/20/25% (+2 to +5), Archer DEF unlocks at Lv. 31 and Archer ATK at Lv. 71; three hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 150% of troop ATK at +2, 200% at +3, 300% at +4, 500% at +5 (in-game).' },
      { name: 'Archer HP', description: '3★: +10% at +2, +15% at +3, +20% at +4, +25% at +5. Applies when he joins troop battle (in-game).' },
      { name: 'Archer DEF', description: '3★: +10% at +2, +15% at +3, +20% at +4, +25% at +5. Applies when he joins troop battle (in-game). Unlocks at Lv. 31.' },
      { name: 'Archer ATK', description: '3★: +10% at +2, +15% at +3, +20% at +4, +25% at +5. Applies when he joins troop battle (in-game). Unlocks at Lv. 71.' },
    ],
  },
  lowStar({ name: 'Hannah', element: 'Light', rarity: 3, unit: 'Cavalry', sources: PLAZA_SUPERB, pages: [PLAZA], march: ['Cavalry HP', 'Cavalry DEF', 'Cavalry ATK'],
    m3: { name: 'Valiant Throw', description: 'Deals 208% damage to the target and adjacent enemies. Skill level for this value not stated.', pattern: 'Target + adjacent', effects: ['Damage'] } }),
  {
    ...lowStar({ name: 'Christina', element: 'Light', rarity: 4, unit: 'Cavalry', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Troop skill', 'Cavalry DEF', 'Cavalry ATK'],
      civil: [{ name: 'Stone Output', description: 'In-game. 4★: +40% at +2, +60% at +3, +80% at +4, +100% at +5.', requirement: 'Active while owned (in-game)', stat: 'resourceOutput', unit: '%',
        tiers: { '4': [null, null, 40, 60, 80, 100] } }],
      m3: { name: 'Blazing Blade', description: 'Deals 429% damage to the target (Rage Regen: Slow). Righteous Rage: all allies DEF +51% for 5 rounds. Descendant of Warlord: DEF +15% and Heal Bonus +8%. Divine Suppression: all allies ATK +10% for 5 rounds. Values as shown in-game at +5.', charge: 'Slow', pattern: 'Single target', effects: ['DEF up', 'ATK up', 'Heal Bonus'] },
      notes: ['In-game (2026-11-23, Christina at +5): 4★ Light Cavalry confirmed. Her skills are a 500% troop skill, Stone Output (civil, active while owned) and Cavalry DEF / ATK (military). This resolves the wiki conflict: she has one civil skill and two (not three) Cavalry stat skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 500% of troop ATK to the enemy (at +5, in-game).' },
      { name: 'Cavalry DEF', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Cavalry ATK', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when she joins troop battle (in-game).' },
    ],
  },
  {
    ...lowStar({ name: 'Hanzo', element: 'Light', rarity: 4, unit: 'Archer', sources: PLAZA_EPIC, pages: [PLAZA], march: ['Troop skill', 'Archer DEF', 'Archer ATK'],
      civil: [{ name: 'Wood Output', description: 'In-game. 4★: +40% at +2, +60% at +3, +80% at +4, +100% at +5.', requirement: 'Active while owned (in-game)', stat: 'resourceOutput', unit: '%', tiers: { '4': [null, null, 40, 60, 80, 100] } }],
      m3: { name: 'Ultimate Thunderbolt', description: 'Deals 358% damage to the target (Rage Regen: Medium). Genjutsu: Bridling Anger (unlocks Lv. 11): depletes 25% of the target\'s Rage. Taijutsu: Repeated Struggles (unlocks Lv. 31): ATK +15% and Crit +8%. Ninjutsu: Blood Drain (unlocks Lv. 71): converts 75% of the damage dealt into HP. Values as shown in-game at +3.', charge: 'Medium', pattern: 'Single target', effects: ['Rage down', 'ATK up', 'Crit', 'Lifesteal'] },
      notes: ['In-game (2026-11-24, Hanzo at +3): 4★ Light Archer confirmed; troop skill 200% of troop ATK; Wood Output 40/60/80/100% (owned); Archer DEF (Lv. 31) and ATK (Lv. 131) 20/30/40/50% (+2 to +5); four hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).' },
      { name: 'Archer DEF', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when he joins troop battle (in-game). Unlocks at Lv. 31.' },
      { name: 'Archer ATK', description: '4★: +20% at +2, +30% at +3, +40% at +4, +50% at +5. Applies when he joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
  // ------------------------------ Dark ------------------------------
  {
    ...lowStar({ name: 'Claudia', element: 'Dark', rarity: 3, unit: 'Cavalry', sources: ['Hero Plaza'], pages: [PLAZA], march: ['Troop skill', 'Cavalry DEF', 'Cavalry ATK'],
      civil: [{ name: 'Stone Gather Speed', description: 'In-game. 3★: +12% at +2, +18% at +3, +24% at +4, +30% at +5.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '3': [null, null, 12, 18, 24, 30] } }],
      m3: { name: 'Night Lights', description: 'Restores 32% HP to all allies (Rage Regen: Fast). Potent Herb: grants 10% Rage to her and adjacent allies. Adrenaline: ATK and DEF +10%. Values as shown in-game at +5.', charge: 'Fast', pattern: 'All allies', effects: ['Heal', 'Rage up', 'ATK up', 'DEF up'] },
      notes: ['Sold for 50 points in the Hero Plaza point shop.', 'In-game (2026-11-23, Claudia at +5): 3★ Dark Cavalry confirmed; troop skill 500% of troop ATK; Stone Gather Speed 12/18/24/30% and Cavalry DEF/ATK 10/15/20/25% (+2 to +5); three hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 500% of troop ATK to the enemy (at +5, in-game).' },
      { name: 'Cavalry DEF', description: '3★: +10% at +2, +15% at +3, +20% at +4, +25% at +5. Applies when she joins troop battle (in-game).' },
      { name: 'Cavalry ATK', description: '3★: +10% at +2, +15% at +3, +20% at +4, +25% at +5. Applies when she joins troop battle (in-game).' },
    ],
  },
];

/**
 * 5- and 6-star heroes added 2026-11-23 after they appeared in an in-game hero list; element, stars and
 * unit type match both the wiki Heroes table and the in-game cards. Only wiki-listed skills are included.
 */
export const addedHighStarHeroes: Hero[] = [
  {
    ...lowStar({ name: 'Sodoma', element: 'Nature', rarity: 5, unit: 'Cavalry', sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Timeless Recruitment', 'Recruit Trial'],
      march: ['Troop skill', 'Troop HP', 'Troop DEF', 'Troop ATK'],
      m3: { name: 'Wraith Spear', description: 'Deals 440% damage to the target (Rage Regen: Medium). Direwolf Raid: depletes 25% of the target\'s Rage. Savage Blessing: +20% Heal Bonus to her and adjacent allies for 5 rounds. Fenrir\'s Terror (unlocks Lv. 71): +35% ATK to her and adjacent allies for 5 rounds. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at +1.', charge: 'Medium', pattern: 'Single target', effects: ['Rage down', 'Heal Bonus', 'ATK up', 'Crit'] },
      bonds: ['Octet Wanderers'], pages: [`${W}Hero_Bond`],
      notes: ['In-game (2026-11-23, Sodoma at +1): 5★ Nature Cavalry confirmed; troop skill 120% of troop ATK; Troop HP/DEF/ATK (all troops) table, Troop ATK unlocks at Lv. 131; five hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).' },
      { name: 'Troop HP', description: '5★: +9.6% at +1, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when she joins troop battle (in-game).' },
      { name: 'Troop DEF', description: '5★: +9.6% at +1, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when she joins troop battle (in-game).' },
      { name: 'Troop ATK', description: '5★: +9.6% at +1, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when she joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
  {
    ...lowStar({ name: 'Setemos', element: 'Dark', rarity: 5, unit: 'Civil', sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Recruit Trial'],
      march: ['Troop skill'],
      civil: [
        { name: 'Safe Resources', description: 'In-game. 5★: +1.8% at +1, then 2.4/3.6/4.8/6/7.5/9/15% from +2 to +8; 6★: 7.5/9.6/11.2/20% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
          tiers: { '5': [null, 1.8, 2.4, 3.6, 4.8, 6, 7.5, 9, 15], '6': [null, null, null, null, null, 7.5, 9.6, 11.2, 20] } },
        { name: 'Hunt ATK Bonus', description: 'In-game. 5★: +22.5% at +1, then 30/45/60/75/95/110/169% from +2 to +8; 6★: 95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
          tiers: { '5': [null, 22.5, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
        { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops while you own him. 5★: +12% at +1, then 16/24/32/40/50/65/80% from +2 to +8; 6★: 50/70/85/150% from +5 to +8.', requirement: 'Unlocks at level 131 (in-game)', unit: '%',
          tiers: { '5': [null, 12, 16, 24, 32, 40, 50, 65, 80], '6': [null, null, null, null, null, 50, 70, 85, 150] } },
      ],
      m3: { name: 'Shadow Assault', description: 'Deals 200% damage to the target and adjacent enemies (Rage Regen: Fast). Soul Devouring Staff: for 4 rounds, when he or adjacent allies are attacked he counterattacks with 100% of the damage received. Dark Blessing: immune to Stun. Underworld Protection (unlocks Lv. 71): the counterattack becomes 150%. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at +1.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['Counterattack', 'Stun immunity', 'Crit'] },
      bonds: ['Sanguine Serenade'], pages: [`${W}Hero_Bond`],
      notes: ['In-game (2026-11-23, Setemos at +1): 5★ Dark Civil confirmed; troop skill 120% of troop ATK; Safe Resources, Hunt ATK Bonus and Troop DEF (Passive, Lv. 131) tables for 5★ and 6★; five hero skills. Hunt ATK Bonus applies while owned (the wiki said it unlocks at level 31).'] }),
    marchSkills: [{ name: 'Troop skill', description: 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).' }],
  },
  {
    ...lowStar({ name: 'Tutanhet', element: 'Fire', rarity: 5, unit: 'Archer', sources: ['Mythic Hero Covenant', 'Timeless Recruitment', 'Recruit Trial', 'Monsters', 'Monster Dens'], pages: [PLAZA],
      march: ['Troop skill', 'Troop HP', 'Troop DEF', 'Troop ATK'],
      m3: { name: 'Arcane Flare', description: 'Deals 200% damage to 3 random enemies (Rage Regen: Medium). Petrifying Gaze: a chance to Paralyze the target for 3 rounds (Paralyzed enemies gain DEF +30% but cannot gain Rage). Elixir Poison: Poison damage to Paralyzed enemies for 3 rounds. Shield Corrosion (unlocks Lv. 71): reduces Paralyzed enemies\' DEF to 10%. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at Hero0.', charge: 'Medium', pattern: 'Random x3', effects: ['Paralyze', 'Poison', 'DEF down', 'Crit'] },
      notes: ['Also sold for 1,000 points in the Hero Plaza point shop; shards drop from Monster den supply chests.', 'In-game (2026-11-23, Tutanhet at Hero0): 5★ Fire Archer confirmed; troop skill 100% of troop ATK; Troop HP/DEF/ATK (all troops) table, Troop ATK unlocks at Lv. 131; five hero skills.'] }),
    marchSkills: [
      { name: 'Troop skill', description: 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).' },
      { name: 'Troop HP', description: '5★: +6.4% at Hero0, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when he joins troop battle (in-game).' },
      { name: 'Troop DEF', description: '5★: +6.4% at Hero0, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when he joins troop battle (in-game).' },
      { name: 'Troop ATK', description: '5★: +6.4% at Hero0, then 12.8/19.2/25.6/32/40/51.2/94% from +2 to +8; 6★: 40/51.2/75/125% from +5 to +8. Applies to all troops when he joins troop battle (in-game). Unlocks at Lv. 131.' },
    ],
  },
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

