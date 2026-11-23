import type {
  AcquisitionSource, ChargeSpeed, CivilSkill, Confidence, Element, Hero, HeroSkill, Rarity, UnitType,
} from '@/types/game';
import { heroAudit } from './heroAudit';
import { addedHighStarHeroes, lowStarHeroes } from './heroesLowStar';

interface HeroInput {
  name: string;
  title: string;
  element: Element;
  rarity: Rarity;
  unit: UnitType;
  role: string;
  march: [string, string][];
  civil?: CivilSkill[];
  m3: { name: string; desc: string; charge?: ChargeSpeed; pattern: string; effects: string[] };
  sources: AcquisitionSource[];
  bonds?: string[];
  curio?: string;
  notes: string;
  confidence?: Confidence;
}

const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** 5★ military-skill tables seen in-game; each hero uses the same values for HP, DEF and ATK. */
const STANDARD_5STAR_MILITARY = '5★ +2 to +8: 32/48/64/80/100/115/188%; 6★ +5 to +8: 100/128/150/250%. Applies when the hero joins troop battle (in-game).';
/** All-troop version (e.g. Eris): lower values because it covers every troop type. */
const ALL_TROOP_5STAR_MILITARY = '5★ +2 to +8: 12.8/19.2/25.6/32/40/51.2/94%; 6★ +5 to +8: 40/51.2/75/125%. Applies to all troops when the hero joins troop battle (in-game).';
const militaryTrio = (troop: string, table = STANDARD_5STAR_MILITARY): [string, string][] =>
  ['HP', 'DEF', 'ATK'].map((stat) => [`${troop} ${stat}`, table] as [string, string]);

function hero(i: HeroInput): Hero {
  const marchSkills: HeroSkill[] = i.march.map(([name, description]) => ({ name, description }));
  return {
    id: slug(i.name),
    name: i.name,
    title: i.title,
    element: i.element,
    rarity: i.rarity,
    unitType: i.unit,
    role: i.role,
    marchSkills,
    civilSkills: i.civil ?? [],
    match3Skill: { name: i.m3.name, description: i.m3.desc, charge: i.m3.charge, pattern: i.m3.pattern, effects: i.m3.effects },
    sources: i.sources,
    bondGroups: i.bonds ?? [],
    exclusiveCurio: i.curio,
    notes: i.notes,
    confidence: i.confidence ?? 'community',
  };
}

const baseHeroes: Hero[] = [
  // ------------------------------ 6-Star ------------------------------
  hero({
    name: 'Khaos', title: 'Sovereign of the Rift', element: 'Dark', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Rift Charge', 'Cavalry ATK up while leading a rally; first strike ignores part of enemy DEF.'], ['Void Dominion', 'Reduces enemy Cavalry and Archer DEF during the first rounds of battle.']],
    m3: { name: 'Abyssal Collapse', desc: 'Huge Dark damage to all enemies and lowers their ATK.', charge: 'Slow', pattern: 'All enemies', effects: ['ATK down', 'High single-cast damage'] },
    sources: ['Combination Event'], curio: 'Riftbreaker Lance',
    notes: 'Civil hero: skills apply by owning the hero. Listed as obtainable only through the Combination Event.', confidence: 'estimate',
  }),
  hero({
    name: 'Anastasia', title: 'Frost Empress', element: 'Fire', rarity: 5, unit: 'All-round', role: 'Garrison anchor',
    march: [['Eternal Winter', 'Infantry DEF and HP up; reduces damage taken by the garrison.'], ['Crown of Rime', 'Chance to freeze enemy Cavalry, lowering their damage for 2 rounds.']],
    m3: { name: 'Joyous', desc: 'Heals all members each round. Second hero skill, Inspiring: restores Rage. Full skill text and values not verified.', pattern: 'All allies', effects: ['Heal', 'Rage restore'] },
    sources: ['Astrology'], curio: 'Rimecrown Sceptre',
    notes: 'Astrology hero. Astrology Summon Scrolls do not expire, so they can be saved across events.',
  }),
  hero({
    name: 'Maxim', title: 'Iron Vanguard', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Ironclad Advance', 'Infantry ATK and DEF up; scales with number of Infantry in the march.'], ['Unbroken Line', 'Reduces damage from Archers to Infantry.']],
    m3: { name: 'Molten Bastion', desc: 'Fire damage to a column and raises team DEF.', charge: 'Medium', pattern: 'Column', effects: ['DEF up'] },
    sources: ['Astrology'],
    notes: 'Civil hero: skills apply by owning the hero.',
  }),
  hero({
    name: 'Guan Yu', title: 'Saint of War', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Green Dragon Crescent', 'Cavalry ATK up; extra damage against Infantry.'], ['Righteous Valor', 'Cavalry HP up and reduces enemy counterattack.']],
    m3: { name: 'Azure Dragon Sweep', desc: 'Nature damage in a wide cone and stuns the target for 1 turn.', charge: 'Medium', pattern: 'Cone (3x3)', effects: ['Stun'] },
    sources: ['Recruit Trial'], curio: 'Azure Dragon Blade',
    notes: 'Recruit Trial probability pool also contains the Azure Dragon Blade Scroll (his exclusive curio).',
  }),
  hero({
    name: 'Saya', title: 'Hearth Steward', element: 'Fire', rarity: 5, unit: 'Civil', role: 'Economy core',
    march: [['Troop skill', '+120% at +1 (in-game; full description not captured).']],
    civil: [
      { name: 'Troop Capacity', description: 'Flat troop capacity (confirmed in-game). 5-star: +2,000, +3,000, +4,000, +6,000, +8,000, +10,000, +12,500, +15,000, +22,500 from Hero0 to +8. 6-star: +12,500, +16,000, +20,000, +30,000 from +5 to +8.', requirement: 'Unlocks at level 131 (as listed on the wiki)', stat: 'troopCap', unit: 'flat',
        tiers: { '5': [2000, 3000, 4000, 6000, 8000, 10000, 12500, 15000, 22500], '6': [null, null, null, null, null, 12500, 16000, 20000, 30000] } },
      { name: 'Construction Speed', description: 'In-game. 5-star: +9% at +1, then +12%, +18%, +24%, +30%, +37.5%, +45%, +75% at +8. 6-star: +37.5%, +48%, +56%, +100% from +5 to +8.', requirement: 'Unlocks at level 31', stat: 'buildSpeed', unit: '%',
        tiers: { '5': [null, 9, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Free Speedup Time', description: 'In-game. 5-star: 9 min at +1, then 12, 18, 24, 30, 40, 45, 60 min at +8 (6 min at Hero0 per the wiki). 6-star: 37.5, 51.2, 55, 80 min from +5 to +8.', requirement: 'Unlock level not verified', unit: 'min',
        tiers: { '5': [6, 9, 12, 18, 24, 30, 40, 45, 60], '6': [null, null, null, null, null, 37.5, 51.2, 55, 80] } },
    ],
    m3: { name: 'Sunlit Blessing', desc: 'Heals allies and cleanses one debuff.', charge: 'Fast', pattern: 'All allies', effects: ['Heal', 'Cleanse'] },
    sources: ['First Top-up', 'Ace Lord Radiant Card'], bonds: ['Rhapsody of Genesis'], curio: 'Wings of Icarus',
    notes: 'Own-only skills: you never need to march her. Highest account-wide value per shard in the game.',
  }),
  // ------------------------------ 5-Star ------------------------------
  hero({
    name: 'Tania', title: 'Storm Archer', element: 'Ice', rarity: 5, unit: 'Cavalry', role: 'Cavalry Support',
    march: [
      ['Troop skill', 'Deals damage equal to 500% of troop ATK to the enemy (at +5, in-game).'],
      ...militaryTrio('Cavalry'),
    ],
    m3: { name: 'Allegro of Life', desc: 'Restores 44% HP to all allies (Rage Regen: Medium). Watershield: all allies DEF +63% for 5 rounds (unlocks Lv. 11). Moisture: dispels all debuffs on allies (unlocks Lv. 31). Elegy: chance to Stun the enemy for 2 rounds when she dies. Iron Will (unlocks at 6★): Crit Res. +30%, a chance to take normal damage from a critical hit. Values as shown in-game at +5.', charge: 'Medium', pattern: 'All allies', effects: ['Heal', 'DEF up', 'Dispel', 'Stun', 'Crit Res.'] },
    sources: ['Timeless Recruitment'], bonds: ['Octet Wanderers'],
    notes: 'Unit type corrected to Cavalry from in-game data.',
  }),
  hero({
    name: 'Dimina', title: 'Starlit Oracle', element: 'Nature', rarity: 5, unit: 'Cavalry', role: 'Support caster',
    march: [['Prophecy', 'Archer DEF up and reduces enemy Cavalry ATK.']],
    m3: { name: 'Constellation', desc: 'Boosts ally mana gain and deals Light damage to a row.', charge: 'Fast', pattern: 'Row', effects: ['Mana gain up'] },
    sources: ["Glory's Gift Roulette"],
    notes: 'Lucky Star Coins do not expire — bank them for her banner.',
  }),
  hero({
    name: 'Kanye', title: 'Beat of War', element: 'Fire', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Drumline Charge', 'Cavalry ATK up; first 3 rounds deal extra damage.']],
    m3: { name: 'Bass Drop', desc: 'Fire damage to a 3x3 area and burns for 2 turns.', charge: 'Medium', pattern: '3x3', effects: ['Burn'] },
    sources: ["Glory's Gift Roulette"],
    notes: 'Strong burn damage in Elemental Seal when Fire is a required element.',
  }),
  hero({
    name: 'Norris', title: 'Bulwark Marshal', element: 'Fire', rarity: 5, unit: 'Archer', role: 'Tank',
    march: [['Shield Wall', 'Infantry DEF up; reduces damage from Cavalry.']],
    m3: { name: 'Permafrost Guard', desc: 'Taunts enemies and gains a large shield.', charge: 'Medium', pattern: 'Self + taunt', effects: ['Taunt', 'Shield'] },
    sources: ['Arms Race Ace Card'], bonds: ['Sanguine Serenade'],
    notes: 'Arms Race Ace Hero Choice Card pick for early realms (> 4 weeks).',
  }),
  hero({
    name: 'Edith', title: 'Iron Matron', element: 'Ice', rarity: 5, unit: 'Archer', role: 'AoE damage and debuffs',
    march: [
      ['Troop skill', 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).'],
      ...militaryTrio('Archer').map(([n, d]) => [n, n === 'Archer ATK' ? `${d} Unlocks at Lv. 131.` : d] as [string, string]),
    ],
    m3: { name: 'Desperate Spike', desc: 'Deals 183% damage to all enemies (Rage Regen: Medium). Wraith Within: enemies DEF −44% for 4 rounds. Bleak Whispers: enemies ATK −34% for 4 rounds. Spiritual Shriek (unlocks Lv. 71): a chance to Stun enemies for 2 rounds. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at +2.', charge: 'Medium', pattern: 'All enemies', effects: ['DEF down', 'ATK down', 'Stun', 'Crit'] },
    sources: ['Strike Out', 'Timeless Recruitment'], bonds: ['Sanguine Serenade'],
    notes: 'Hits all enemies and lowers their DEF and ATK.',
  }),
  hero({
    name: 'Boyd', title: 'Ember Captain', element: 'Nature', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [
      ['Troop skill', 'Deals damage equal to 300% of troop ATK to the enemy (at +4, in-game).'],
      ...militaryTrio('Cavalry'),
    ],
    m3: { name: 'Claw of Void', desc: 'Deals 530% damage to the target; if the enemy falls, gains Crit Rate +30% for 5 rounds (Rage Regen: Medium). Strength Absorption: transfers buffs on the target to random allies. Self-healing Instinct: at battle start, restores 5% HP to Nature allies each round for 6 rounds. Cold Blood: deals 40% more damage to Fire heroes (cannot be dispelled). Target Weakness (unlocks at 6★): Break +30%, a chance to ignore parry. Values as shown in-game at +4.', charge: 'Medium', pattern: 'Single target', effects: ['Crit Rate up', 'Buff transfer', 'Heal over time', 'Bonus vs Fire', 'Break'] },
    sources: ['Ace Lord'],
    notes: 'Radiant Hero Choice Card option from realm day 1.',
  }),
  hero({
    name: 'Monica', title: 'Silver Lancer', element: 'Dark', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Radiant Lance', 'Cavalry ATK and HP up.']],
    m3: { name: 'Dawn Pierce', desc: 'Light damage to a column; ignores 30% DEF.', charge: 'Medium', pattern: 'Column', effects: ['DEF ignore'] },
    sources: ['Ace Lord Radiant Card'],
    notes: 'Radiant Card option once realm age exceeds 4 weeks.',
  }),
  hero({
    name: 'Kaios', title: 'Tidebinder', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Undertow', 'Archer ATK up; slows enemy march speed in the field.']],
    m3: { name: 'Riptide', desc: 'Ice damage to a 3x3 area and freezes for 1 turn.', charge: 'Medium', pattern: '3x3', effects: ['Freeze'] },
    sources: ['Ace Lord', 'AP Event'],
    notes: 'AP Visiting events also feature his shards.',
  }),
  hero({
    name: 'Aerposia', title: 'Sky Sovereign', element: 'Dark', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Skyfall', 'Archer ATK up; damage up when attacking structures.']],
    m3: { name: 'Celestial Rain', desc: 'Light damage to all enemies.', charge: 'Slow', pattern: 'All enemies', effects: ['AoE'] },
    sources: ['Ace Lord'],
    notes: 'Radiant Card option after realm age > 22 weeks.',
  }),
  hero({
    name: 'Valerius', title: 'Crimson Warden', element: 'Nature', rarity: 5, unit: 'All-round', role: 'All-troop DPS',
    march: [['Blood Oath', 'Infantry ATK up; heals a portion of damage dealt.']],
    m3: { name: 'Crimson Cleave', desc: 'Fire damage to a row with lifesteal.', charge: 'Medium', pattern: 'Row', effects: ['Lifesteal'] },
    sources: ['Astrology'],
    notes: 'Astrology rate-up hero.',
  }),
  hero({
    name: 'Tala', title: 'Wildheart', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Hunter Instinct', 'Archer ATK up; crit chance vs Cavalry.']],
    m3: { name: 'Thornstorm', desc: 'Nature damage to a column and poisons for 3 turns.', charge: 'Fast', pattern: 'Column', effects: ['Poison'] },
    sources: ['Astrology'],
    notes: 'Fast-charging poison makes her a reliable Elemental Seal Nature pick.',
  }),
  hero({
    name: 'Eris', title: 'Discord Blade', element: 'Dark', rarity: 5, unit: 'Cavalry', role: 'Assassin',
    march: [
      ['Troop skill', 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).'],
      ...militaryTrio('Troop', ALL_TROOP_5STAR_MILITARY),
    ],
    m3: { name: 'Void Oblivion', desc: 'Deals 220% damage to all enemies (Rage Regen: Slow). Distracted Mind: reduces enemies\' Hit by 40% for 6 rounds. Fiend\'s Rage: gains 30% Rage at the start of battle. Descent of Fear: a chance to Stun enemies for 2 rounds. Combat Mastery (unlocks at 6★): Crit +30%, a chance to deal double damage. Values as shown in-game at +3.', charge: 'Slow', pattern: 'All enemies', effects: ['Hit down', 'Rage up', 'Stun', 'Crit'] },
    sources: ['Recruit Trial', 'Timeless Recruitment'], bonds: ['Sanguine Serenade'],
    notes: 'Hits every enemy and can Stun; her troop bonus covers all troop types.',
  }),
  hero({
    name: 'Kujo Mamoru', title: 'Shrine Guardian', element: 'Nature', rarity: 5, unit: 'Infantry', role: 'Tank',
    march: [
      ['Troop skill', 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).'],
      ...militaryTrio('Infantry').map(([n, d]) => [n, n === 'Infantry ATK' ? `${d} Unlocks at Lv. 131.` : d] as [string, string]),
    ],
    m3: { name: 'Zoetic Enchantment', desc: 'Evens out the damage taken among allies, and among enemies, for 4 rounds (Rage Regen: Slow). Disarm: enemies DEF −44%. Traceless Shadow: Dodge +20%. Elf\'s Shelter (unlocks Lv. 71): all allies DEF +63%. Unbending (unlocks at 6★): Parry +30%. Values as shown in-game at +2.', charge: 'Slow', pattern: 'All allies and enemies', effects: ['Damage sharing', 'DEF down', 'Dodge', 'DEF up', 'Parry'] },
    sources: ['Strike Out', 'Timeless Recruitment'], bonds: ['Rhapsody of Genesis'],
    notes: 'Shards also sold in the Commander Shop (5,000 each, unlimited).',
  }),
  hero({
    name: 'Rodriguez', title: 'Desert Gunner', element: 'Light', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Powder Keg', 'Archer ATK up; bonus damage vs structures.']],
    m3: { name: 'Dynamite', desc: 'Fire damage to a 3x3 area.', charge: 'Medium', pattern: '3x3', effects: ['AoE'] },
    sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Personal Activity', 'Recruit Trial', 'Timeless Recruitment'], bonds: ['Rhapsody of Genesis'],
    notes: 'Bi-weekly Personal Activity shards make him a free long-term Infantry hero.',
  }),
  hero({
    name: 'Freya', title: 'Valkyrie', element: 'Nature', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Valhalla Ride', 'Cavalry ATK up; extra damage when HP is above 50%.']],
    m3: { name: 'Einherjar', desc: 'Ice damage to a row and grants ally ATK up.', charge: 'Medium', pattern: 'Row', effects: ['ATK up'] },
    sources: ['Lucky Spin', 'Recruit Trial', 'Timeless Recruitment'], bonds: ['Rhapsody of Genesis'],
    notes: 'Lucky Spin banner on newer realms.',
  }),
  hero({
    name: 'Fiona', title: 'Grove Keeper', element: 'Fire', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).']],
    civil: [
      { name: 'Training Speed', description: 'In-game. 5★: +7.5% at +1, then 10/15/20/25/31.25/37.5/75% from +2 to +8; 6★: 31.25/40/50/100% from +5 to +8.', requirement: 'Active while owned (in-game)', stat: 'trainSpeed', unit: '%',
        tiers: { '5': [null, 7.5, 10, 15, 20, 25, 31.25, 37.5, 75], '6': [null, null, null, null, null, 31.25, 40, 50, 100] } },
      { name: 'Stamina Cost Down', description: 'In-game. 5★: −4.5% at +1, then −6/−9/−12/−15/−18.75/−22.5/−24% from +2 to +8; 6★: −18.75/−24/−26/−28% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, -4.5, -6, -9, -12, -15, -18.75, -22.5, -24], '6': [null, null, null, null, null, -18.75, -24, -26, -28] } },
      { name: 'Training Cost Down', description: 'In-game. 5★: −4.5% at +1, then −6/−9/−12/−15/−18.75/−22.5/−24% from +2 to +8; 6★: −18.75/−24/−26/−28% from +5 to +8.', requirement: 'Unlocks at level 131 (in-game)', unit: '%',
        tiers: { '5': [null, -4.5, -6, -9, -12, -15, -18.75, -22.5, -24], '6': [null, null, null, null, null, -18.75, -24, -26, -28] } },
    ],
    m3: { name: 'Inferno Breath', desc: 'Deals 161% damage to all enemies (Rage Regen: Slow). Draconic Flames: Poison damage to enemies for 6 rounds. Drake Companion: all allies ATK +34% for 6 rounds. Sunset Explosion (unlocks Lv. 71): self-detonates on death for 140% damage to all enemies. Combat Mastery: locked, value not captured. Values as shown in-game at +1.', charge: 'Slow', pattern: 'All enemies', effects: ['Poison', 'ATK up', 'Death explosion'] },
    sources: ['Timeless Recruitment'], bonds: ['Octet Wanderers'],
    notes: 'Training speed and cost cuts work just by owning her. Shards also sold in the Sapphire Shop (350,000 each).',
  }),
  hero({
    name: 'Carvell', title: 'Arcane Engineer', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Siege Matrix', 'Archer ATK up vs structures; reduces enemy wall DEF.']],
    m3: { name: 'Overclock', desc: 'Dark damage to a column and lowers enemy mana.', charge: 'Medium', pattern: 'Column', effects: ['Mana drain'] },
    sources: ['Astrology', 'Feast of Destiny / Wonder House', 'Pyramid Event', 'AP Event', 'Timeless Recruitment'], bonds: ['Sanguine Serenade'],
    notes: 'Appears in many event pools — never spend premium currency on him directly.',
  }),
  hero({
    name: 'Wu Kong', title: 'Monkey King', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).']],
    civil: [
      { name: 'Troop HP (Passive)', description: 'In-game, applies to all troops while you own him. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops while you own him. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop ATK (Passive)', description: 'In-game, applies to all troops while you own him. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
    ],
    m3: { name: 'Cosmic Rod', desc: 'Deals 450% damage to the enemy target (Rage Regen: Fast). Might of a Thousand: also deals 20% of ATK as True Damage (ignores DEF). Immobilization Spell: immobilizes the target for 2 rounds (cannot attack, gain Rage or recover HP). Immunity to Evil: immune to Poison and Burn. Combat Mastery (unlocks at 6★): Crit +30%, a chance to deal double damage. Values as shown in-game at +3.', charge: 'Fast', pattern: 'Single target', effects: ['True damage', 'Immobilize', 'Poison/Burn immunity', 'Crit'] },
    sources: ['Timeless Recruitment', 'Mythic Hero Choice Card III', 'Stamina Event'],
    notes: 'Stamina Event drops expire — spend them before the event ends.',
  }),
  hero({
    name: 'Oichi', title: 'Blossom Blade', element: 'Fire', rarity: 6, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Sakura Charge', 'Cavalry ATK up; bonus vs Infantry.']],
    m3: { name: 'Petal Storm', desc: 'Nature damage to all enemies and reduces healing.', charge: 'Slow', pattern: 'All enemies', effects: ['Anti-heal'] },
    sources: ['Battle Pass Event'],
    notes: 'Anti-heal is valuable in Arena against Fiona/Edith teams.', confidence: 'estimate',
  }),
  hero({
    name: 'Sirius', title: 'Dog Star', element: 'Fire', rarity: 6, unit: 'Archer', role: 'Archer DPS',
    march: [['Brightest Star', 'Archer ATK up; crit rate up at night-time battles.']],
    m3: { name: 'Stellar Lance', desc: 'Light damage to a single target, high crit.', charge: 'Fast', pattern: 'Single target', effects: ['Crit'] },
    sources: ['Battle Pass Event'],
    notes: 'Single-target nuker for bosses.', confidence: 'estimate',
  }),
  hero({
    name: 'Vynora', title: 'Venom Queen', element: 'Ice', rarity: 6, unit: 'All-round', role: 'DoT',
    march: [['Toxic Volley', 'Archer ATK up; poisons on hit.']],
    m3: { name: 'Venom Bloom', desc: 'Dark damage to a 3x3 area and applies stacking poison.', charge: 'Medium', pattern: '3x3', effects: ['Poison'] },
    sources: ['Battle Pass Event'],
    notes: 'Poison stacks ignore boss stun/silence immunity.', confidence: 'estimate',
  }),
  hero({
    name: 'Snowball & Ivy', title: 'Frost Twins', element: 'Ice', rarity: 6, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Twin Bond', 'All troop DEF up slightly.']],
    m3: { name: 'Snowball Fight', desc: 'Ice damage to random enemies and freezes one.', charge: 'Fast', pattern: 'Random x4', effects: ['Freeze'] },
    sources: ['Battle Pass'],
    notes: 'Seasonal duo; decent Ice filler.', confidence: 'estimate',
  }),
  hero({
    name: 'Leora', title: 'Lionheart', element: 'Light', rarity: 6, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Pride', 'Infantry ATK up; damage up per surviving ally.']],
    m3: { name: 'Roar of Dawn', desc: 'Light damage to a row and raises ally ATK.', charge: 'Medium', pattern: 'Row', effects: ['ATK up'] },
    sources: ['Hero Plaza'],
    notes: 'Light Cavalry option for Elemental Seal requirements.', confidence: 'estimate',
  }),
  hero({
    name: 'Apan', title: 'Wind Rider', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Gale Charge', 'Cavalry ATK and march speed up.']],
    m3: { name: 'Cyclone', desc: 'Nature damage to a column and pushes enemy mana back.', charge: 'Medium', pattern: 'Column', effects: ['Mana down'] },
    sources: ['Arms Race Ace Card'], bonds: ['Octet Wanderers'],
    notes: 'Arms Race Ace Card option from realm day 1.',
  }),
  hero({
    name: 'Patty', title: 'Sweet Saboteur', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Sugar Rush', 'Archer ATK up; attack speed up in the first round.']],
    m3: { name: 'Candy Bomb', desc: 'Fire damage to a 3x3 area and stuns the center target.', charge: 'Medium', pattern: '3x3', effects: ['Stun'] },
    sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Card option once realm age exceeds 12 weeks.',
  }),
  hero({
    name: 'Angelita', title: 'Seraph of Mercy', element: 'Light', rarity: 5, unit: 'Archer', role: 'Healer',
    march: [['Mercy', 'Reduces troop losses and raises all troop HP.']],
    m3: { name: 'Halo', desc: 'Heals all allies and revives one fallen hero at 30% HP.', charge: 'Slow', pattern: 'All allies', effects: ['Heal', 'Revive'] },
    sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Card option after realm age > 22 weeks — best pick of the late pool.',
  }),
  hero({
    name: 'Lylia', title: 'Moonblade', element: 'Fire', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Lunar Edge', 'Cavalry ATK up; extra damage vs Archers.']],
    m3: { name: 'Crescent Slash', desc: 'Dark damage to a row twice.', charge: 'Fast', pattern: 'Row x2', effects: ['Multi-hit'] },
    sources: ['Royal Arms Race'],
    notes: 'Royal Arms Race ranking reward shards.',
  }),
  hero({
    name: 'Oskir', title: 'Runesmith', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Runic Armor', 'Infantry DEF up; damage reduction vs skills.']],
    m3: { name: 'Glyph Ward', desc: 'Shields the front row and reduces enemy ATK.', charge: 'Medium', pattern: 'Front row allies', effects: ['Shield', 'ATK down'] },
    sources: ['Alliance Duel'],
    notes: 'Alliance Duel reward shards.',
  }),
  hero({
    name: 'Echo', title: 'Whisper of the Void', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Resonance', 'Archer ATK up; repeats a portion of skill damage.']],
    m3: { name: 'Reverb', desc: 'Dark damage to a column, echoing 50% damage next turn.', charge: 'Medium', pattern: 'Column', effects: ['Delayed hit'] },
    sources: ['Feast of Destiny / Wonder House', 'Oblivion War Shop'],
    notes: 'Divination Crystals expire — spend all of them before Feast of Destiny / Wonder House ends.',
  }),
  hero({
    name: 'Ogremire', title: 'Swamp Tyrant', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Bog Hide', 'Infantry HP up significantly.']],
    m3: { name: 'Mire Slam', desc: 'Nature damage to a 3x3 area and slows mana gain.', charge: 'Slow', pattern: '3x3', effects: ['Mana slow'] },
    sources: ['Shadow Expedition'],
    notes: 'Shadow Expedition reward shards.',
  }),
  hero({
    name: 'Neptune', title: 'Lord of Tides', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Tidal Force', 'Archer ATK up.']],
    m3: { name: 'Trident Wave', desc: 'Ice damage to all enemies.', charge: 'Slow', pattern: 'All enemies', effects: ['AoE'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Stamina Event drops expire.',
  }),
  hero({
    name: 'Kaira', title: 'Coral Priestess', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Coral Ward', 'All troop DEF up slightly.']],
    m3: { name: 'Sea Hymn', desc: 'Heals all allies and cleanses freeze/burn.', charge: 'Fast', pattern: 'All allies', effects: ['Heal', 'Cleanse'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Cleanse is useful vs Fire burn bosses.',
  }),
  hero({
    name: 'Sea Goddess', title: 'Mother of Waves', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Abyssal Pressure', 'Lowers enemy march speed and Archer DEF.']],
    m3: { name: 'Maelstrom', desc: 'Ice damage to a 3x3 area and freezes for 2 turns.', charge: 'Slow', pattern: '3x3', effects: ['Freeze'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Freeze is ignored by Elemental Seal bosses from Round 11+.',
  }),
  hero({
    name: 'Leona', title: 'Pride Huntress', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Hunt', 'Cavalry ATK up; extra damage to wounded enemies.']],
    m3: { name: 'Pounce', desc: 'Fire damage to the lowest-HP enemy, executes below 20%.', charge: 'Fast', pattern: 'Single target', effects: ['Execute'] },
    sources: ['AP Event', 'Timeless Recruitment'],
    notes: 'AP Visiting items expire.',
  }),
  hero({
    name: 'Basilong', title: 'Dragonkin', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Scale Armor', 'Infantry ATK and DEF up.']],
    m3: { name: 'Dragon Breath', desc: 'Fire damage to a cone and burns.', charge: 'Medium', pattern: 'Cone', effects: ['Burn'] },
    sources: ['Lucky Flip'],
    notes: 'Lucky Coins do not expire — save them across Lucky Flip runs.',
  }),
  hero({
    name: 'Edmund', title: 'Gilded Knight', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Gilded Charge', 'Cavalry HP and ATK up.']],
    civil: [
      { name: 'Food Output', description: 'Increases food output. Value not verified.', requirement: 'Unlock level not verified' },
      { name: 'Medical Tent Speed', description: 'Increases Medical Tent speed. Value not verified.', requirement: 'Unlock level not verified' },
    ],
    m3: { name: 'Gleam', desc: 'Light damage to a row and blinds (accuracy down).', charge: 'Medium', pattern: 'Row', effects: ['Blind'] },
    sources: ['Lucky Flip'], bonds: ['Rhapsody of Genesis'],
    notes: 'Lucky Flip pool.',
  }),
  hero({
    name: 'Aurora', title: 'Northern Light', element: 'Dark', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).']],
    civil: [
      { name: 'Gather March Speed', description: 'In-game. 5★: +12% at +2 up to +75% at +8; 6★: +37.5% at +5 up to +100% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Heal Stone Cost', description: 'In-game. 5★: −8% at +2 up to −32% at +8; 6★: −25% at +5 up to −36% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, -8, -12, -16, -20, -25, -30, -32], '6': [null, null, null, null, null, -25, -32, -35, -36] } },
      { name: 'Rally Size', description: 'In-game. 5★: +80,000 at +2 up to +375,000 at +8; 6★: +250,000 at +5 up to +500,000 at +8.', requirement: 'Unlocks at level 131 (in-game)', unit: 'flat',
        tiers: { '5': [null, null, 80000, 120000, 160000, 200000, 250000, 300000, 375000], '6': [null, null, null, null, null, 250000, 320000, 330000, 500000] } },
    ],
    m3: { name: 'Call of Death', desc: 'Marks the target for 4 rounds; when the mark expires it deals true damage (ignores DEF) equal to 99% of the target\'s remaining HP. She cannot gain Rage for 4 rounds (cannot be dispelled). Rage Regen: Slow. Petrifying Gaze: target Rage Regen −50%. Darkness Domain: Dark allies +10% Rage Regen at battle start (cannot be dispelled). Serpent Lineage (unlocks Lv. 71): immune to Poison and Burn. Unbending (unlocks at 6★): Parry +30%. Values as shown in-game at +2.', charge: 'Slow', pattern: 'Single target', effects: ['True damage', 'Rage down', 'Rage up', 'Poison/Burn immunity', 'Parry'] },
    sources: ['Lucky Flip'],
    notes: 'Lucky Flip pool.',
  }),
  hero({
    name: 'Selantia', title: 'Moon Priestess', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Support',
    march: [['Moonlit Rite', 'All troop ATK up slightly.']],
    m3: { name: 'Eclipse', desc: 'Dark damage to all enemies and lowers their DEF.', charge: 'Slow', pattern: 'All enemies', effects: ['DEF down'] },
    sources: ["Glory's Gift Roulette"],
    notes: "Glory's Gift Roulette pool.",
  }),
  hero({
    name: 'Eric', title: 'Sword Saint', element: 'Dark', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Blade Dance', 'Infantry ATK up; crit chance up.']],
    m3: { name: 'Thousand Cuts', desc: 'Nature damage to a single target 5 times.', charge: 'Medium', pattern: 'Single x5', effects: ['Multi-hit'] },
    sources: ['Lucky Spin', 'Timeless Recruitment'],
    notes: 'Lucky Spin pool on newer realms.',
  }),
  // ------------------------------ Civil / Economy ------------------------------
  hero({
    name: 'William', title: 'Master Builder', element: 'Dark', rarity: 2, unit: 'Civil', role: 'Construction',
    march: [],
    civil: [
      { name: 'Iron Output', description: 'Increases iron output. Value not verified.', requirement: 'Unlock level not verified', stat: 'resourceOutput' },
      { name: 'Construction Food Cost', description: 'Reduces the food cost of construction. Value not verified.', requirement: 'Unlock level not verified', stat: 'buildCost' },
      { name: 'Construction Wood Cost', description: 'Reduces the wood cost of construction. Value not verified.', requirement: 'Unlock level not verified', stat: 'buildCost' },
    ],
    m3: { name: 'Scaffold', desc: 'Small Nature damage to a row.', charge: 'Fast', pattern: 'Row', effects: [] },
    sources: ['Hero Plaza', 'Starter / Campaign'],
    notes: 'Own-only construction cost reduction. Enhance before big Citadel pushes.',
  }),
  hero({
    name: 'Chloe', title: 'Quartermaster', element: 'Dark', rarity: 3, unit: 'Civil', role: 'Construction',
    march: [],
    civil: [
      { name: 'Free Speedup Time', description: 'Adds free speedup time. Value not verified.', requirement: 'Unlock level not verified' },
      { name: 'Construction Stone Cost', description: 'Reduces the stone cost of construction. Value not verified.', requirement: 'Unlock level not verified', stat: 'buildCost' },
      { name: 'Construction Iron Cost', description: 'Reduces the iron cost of construction. Value not verified.', requirement: 'Unlock level not verified', stat: 'buildCost' },
    ],
    m3: { name: 'Ration Drop', desc: 'Heals one ally.', charge: 'Fast', pattern: 'Single ally', effects: ['Heal'] },
    sources: ['Hero Plaza', 'Superb Hero Covenant', 'Hero Recruitment'],
    notes: 'Stacks with William — both cost reductions are additive.',
  }),
  hero({
    name: 'Elsa', title: 'Frost Architect', element: 'Dark', rarity: 4, unit: 'Civil', role: 'Construction speed',
    march: [],
    civil: [
      { name: 'Construction Speed', description: 'Increases construction speed. Value not verified.', requirement: 'Unlock level not verified', stat: 'buildSpeed' },
      { name: 'Iron Output', description: 'Increases iron output. Value not verified.', requirement: 'Unlock level not verified', stat: 'resourceOutput' },
      { name: 'Rally Size', description: '+20,000 at the lowest tier rising to +100,000 at the highest.', requirement: 'Unlocks at level 131 (as listed on the wiki)', unit: 'flat',
        tiers: { '4': [20000, null, null, null, null, 100000] } },
    ],
    m3: { name: 'Frost Pillar', desc: 'Ice damage to a column.', charge: 'Medium', pattern: 'Column', effects: [] },
    sources: ['Hero Plaza', 'Epic Hero Covenant'],
    notes: 'Own-only build speed — counts toward the Citadel net-time calculator.',
  }),
  hero({
    name: 'Gina', title: 'Harvest Keeper', element: 'Dark', rarity: 4, unit: 'Civil', role: 'Gathering',
    march: [['Skill', 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).']],
    civil: [
      { name: 'Research Speed', description: 'In-game: +6% at +2, +9% at +3, +12% at +4, +15% at +5 (4★).', requirement: 'Unlock level not verified', stat: 'researchSpeed', unit: '%',
        tiers: { '4': [null, null, 6, 9, 12, 15] } },
      { name: 'EXP Potion Output', description: 'In-game: +40% at +2, +60% at +3, +80% at +4, +100% at +5 (4★).', requirement: 'Unlock level not verified', unit: '%',
        tiers: { '4': [null, null, 40, 60, 80, 100] } },
      { name: 'Troop Capacity', description: 'In-game: +4,000 at +2, +6,000 at +3, +8,000 at +4, +10,000 at +5 (4★).', requirement: 'Unlocks at level 131 (as listed on the wiki)', stat: 'troopCap', unit: 'flat',
        tiers: { '4': [null, null, 4000, 6000, 8000, 10000] } },
    ],
    m3: { name: 'Seed Burst', desc: 'Small Nature damage to random enemies.', charge: 'Fast', pattern: 'Random x3', effects: [] },
    sources: ['Epic Hero Covenant', 'Trial Turret Shop'],
    notes: 'Civil hero: skills apply by owning the hero.',
  }),
];

/**
 * Revision of the bundled hero data. Bump it whenever bundled hero facts are corrected, so the
 * corrections replace older online-pack rows (which carry a lower or missing revision) on re-seed.
 * Revision 1 = 2026-11-23 community-wiki audit; revision 2 = civil-skill value tables for My Heroes;
 * revision 3 = in-game Saya table, five added heroes, in-game element confirmations;
 * revision 4 = in-game Gina skill tables and element; revision 5 = in-game Saya Construction Speed and Free Speedup tables;
 * revision 6 = in-game Tania troop skills and hero skills; revision 7 = in-game Boyd skills; revision 8 = in-game Eris skills;
 * revision 9 = in-game Wu Kong skills (owned-hero troop passives); revision 10 = in-game Isabella skills;
 * revision 11 = in-game Sirona skills; revision 12 = in-game Christina skills;
 * revision 13 = in-game Ysera skills; revision 14 = in-game Edith skills;
 * revision 15 = in-game Aurora skills; revision 16 = in-game Kujo Mamoru skills;
 * revision 17 = in-game Sodoma skills; revision 18 = in-game Odell skills;
 * revision 19 = in-game Fiona skills.
 */
export const HERO_DATA_REVISION = 19;

export const heroes: Hero[] = [...baseHeroes, ...lowStarHeroes, ...addedHighStarHeroes].map((h) => ({ ...h, audit: heroAudit[h.id] ?? h.audit, revision: HERO_DATA_REVISION }));
