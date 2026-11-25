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
    name: 'Anastasia', title: 'Frost Empress', element: 'Fire', rarity: 5, unit: 'All-round', role: 'Revive and sustain support',
    march: [['Troop HP', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when she joins troop battle (in-game).'], ['Troop DEF', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when she joins troop battle (in-game).'], ['Troop ATK', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when she joins troop battle (in-game).']],
    m3: { name: 'Dance of Rebirth', desc: 'All dead allies have a 33% chance to Revive with 10% HP (Rage Regen: Slow). Joyous: all members recover 15% HP each round for 4 rounds. Inspiring: all members recover a little Rage each round for 4 rounds. Resolute: immune to Rage reduction. Iron Will (unlocks at 6★): Crit Res. +30%. Values as shown in-game at 6★ +8.', charge: 'Slow', pattern: 'All allies', effects: ['Revive', 'Heal over time', 'Rage up', 'Rage-reduction immunity', 'Crit Res.'] },
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
    march: [],
    civil: [
      { name: 'Infantry HP (Passive)', description: 'In-game, active once unlocked while you own him. 5★: +25.6% at +2 up to +188% at +8; 6★: +80/102.4/150/250% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 25.6, 38.4, 51.2, 64, 80, 102.4, 188], '6': [null, null, null, null, null, 80, 102.4, 150, 250] } },
      { name: 'Archer DEF (Passive)', description: 'In-game, active once unlocked while you own him. 5★: +25.6% at +2 up to +188% at +8; 6★: +80/102.4/150/250% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 25.6, 38.4, 51.2, 64, 80, 102.4, 188], '6': [null, null, null, null, null, 80, 102.4, 150, 250] } },
      { name: 'Cavalry ATK (Passive)', description: 'In-game, active once unlocked while you own him. 5★: +25.6% at +2 up to +188% at +8; 6★: +80/102.4/150/250% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 25.6, 38.4, 51.2, 64, 80, 102.4, 188], '6': [null, null, null, null, null, 80, 102.4, 150, 250] } },
    ],
    m3: { name: 'Rising Slash', desc: 'Deals 530% damage to the target (Rage Regen: Medium). Cheering Drums: Nature allies +10% Rage Regen at battle start (cannot be dispelled). Martial Saint: ATK +5% per round, up to 80% (cannot be dispelled). Dragon Soul Power: guaranteed Crit when the target is below 50% HP. Target Weakness (6★): Break +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Single target', effects: ['Rage up', 'ATK up', 'Crit', 'Break'] },
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
    name: 'Kanye', title: 'Beat of War', element: 'Fire', rarity: 5, unit: 'Archer', role: 'Archer and Infantry damage',
    march: [['Archer ATK', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350%. Applies when he joins troop battle (in-game).'], ['Infantry ATK', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350%. Applies when he joins troop battle (in-game).'], ['Troop DEF', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350%. Applies when he joins troop battle (in-game). Applies to all troops.']],
    m3: { name: 'Arrow of Scorch', desc: 'Eliminates 2 random columns of pieces, each piece dealing 300% damage (no Rage gained from this), and the defender deals 300% area damage (Rage Regen: Medium). Incineration: pieces eliminated by this skill do not raise enemy Rage. Primal Fire (passive): a chance each round to turn a random piece into a bomb. Flaming Shield: shield for 3 rounds; when it ends, 20% of the damage taken by allied heroes is dealt to all enemies. Combat Mastery (6★): Crit +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: '2 columns', effects: ['Board clear', 'Bomb', 'Shield', 'Damage reflect', 'Crit'] },
    sources: ["Glory's Gift Roulette"],
    notes: 'Strong burn damage in Elemental Seal when Fire is a required element.',
  }),
  hero({
    name: 'Norris', title: 'Bulwark Marshal', element: 'Fire', rarity: 5, unit: 'Archer', role: 'AoE damage (Burn)',
    march: [
      ['Troop skill', 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).'],
      ...militaryTrio('Archer').map(([n, d]) => [n, n === 'Archer DEF' ? `${d} Unlocks at Lv. 31.` : n === 'Archer ATK' ? `${d} Unlocks at Lv. 131.` : d] as [string, string]),
    ],
    m3: { name: 'Bloody Praise', desc: 'Deals 170% damage to all enemies and Burns all enemies for 5 rounds (Rage Regen: Medium). Fatal Gaze (unlocks Lv. 11): inflicts Blast on the target, dealing high damage when it wears off. Crimson Realm (unlocks Lv. 31): Fire allies +10% Rage Regen at battle start (cannot be dispelled). Blood Rush (unlocks Lv. 71): ATK +5% per round from the start of battle, up to 80% (cannot be dispelled). Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at +3.', charge: 'Medium', pattern: 'All enemies', effects: ['Burn', 'Blast', 'Rage up', 'ATK up', 'Crit'] },
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
    march: [],
    civil: [
      { name: 'Castle Battle HP (Passive)', description: 'In-game: troop HP bonus when fighting in your castle (defending), active while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95% at +5 up to +225% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Castle Battle DEF (Passive)', description: 'In-game: troop DEF bonus when fighting in your castle (defending), active while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95% at +5 up to +225% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Castle Battle ATK (Passive)', description: 'In-game: troop ATK bonus when fighting in your castle (defending), active while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95% at +5 up to +225% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
    ],
    m3: { name: 'Deadly Phantom', desc: 'Deals 360% damage to the target (Rage Regen: Medium). Twisted Spirit: dispels the target\'s buffs and drains 40% of its Rage. Heartbreak Moment: enemies\' Heal Rate −50% for 4 rounds (cannot be dispelled). Energy Extraction: converts 70% of the damage dealt into HP. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Single target', effects: ['Dispel', 'Rage down', 'Heal down', 'Lifesteal', 'Crit'] },
    sources: ['Ace Lord Radiant Card'],
    notes: 'Castle defender: her HP, DEF and ATK bonuses apply to your troops when fighting in your castle, just by owning her. Radiant Card option once realm age exceeds 4 weeks.',
  }),
  hero({
    name: 'Kaios', title: 'Tidebinder', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).']],
    civil: [
      { name: 'Infantry HP (Passive)', description: 'In-game, applies while you own him. 5★: +12% at Hero0, then 24/36/48/60/75/90/150% from +2 to +8; 6★: 75/90/120/200% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '5': [12, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
      { name: 'Cavalry HP (Passive)', description: 'In-game, applies while you own him. 5★: +12% at Hero0, then 24/36/48/60/75/90/150% from +2 to +8; 6★: 75/90/120/200% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%', tiers: { '5': [12, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
      { name: 'Archer HP (Passive)', description: 'In-game, applies while you own him. 5★: +12% at Hero0, then 24/36/48/60/75/90/150% from +2 to +8; 6★: 75/90/120/200% from +5 to +8.', requirement: 'Unlocks at level 131 (in-game)', unit: '%', tiers: { '5': [12, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
    ],
    m3: { name: 'Temporal Rift', desc: 'Deals 330% damage to the target at Hero0, rising to 390% at 6★ +8 (Rage Regen: Medium). Time Cage: Silences the target for 3 rounds. Back to the Past: converts 75% of the damage dealt into his own HP. Cycle of Rebirth (unlocks Lv. 71): at battle start gains the ability to revive with 50% HP after death. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at Hero0.', charge: 'Medium', pattern: 'Single target', effects: ['Silence', 'Lifesteal', 'Revive', 'Crit'] },
    sources: ['Ace Lord', 'AP Event'],
    notes: 'His Infantry, Cavalry and Archer HP bonuses work just by owning him. AP Visiting events also feature his shards.',
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
    march: [['Troop HP', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when he joins troop battle (in-game).'], ['Troop DEF', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when he joins troop battle (in-game).'], ['Troop ATK', '5★ +2 to +8: 18.4/27.6/36.8/46/57.6/73.7/135.3%; 6★ +5 to +8: 57.6/73.7/108/180%. Applies to all troops when he joins troop battle (in-game).']],
    m3: { name: 'Holy Verdict', desc: 'Deals 320% damage to the target and adjacent enemies (Rage Regen: Fast). Dazzling Light: target Hit Rate −40% for 4 rounds. Nourishment of Light: converts 30% of damage dealt into HP. Power of Radiance: Nature allies +10% Crit Rate for 4 rounds from battle start (cannot be dispelled). Unbending (6★): Parry +30%. Values as shown in-game at 6★ +8.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['Hit down', 'Lifesteal', 'Crit Rate up', 'Parry'] },
    sources: ['Astrology'],
    notes: 'Astrology rate-up hero.',
  }),
  hero({
    name: 'Tala', title: 'Wildheart', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Safe Resources', description: 'In-game. 5★: +2.4% at +2 up to +15% at +8; 6★: +7.5/9.6/11.2/20% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 2.4, 3.6, 4.8, 6, 7.5, 9, 15], '6': [null, null, null, null, null, 7.5, 9.6, 11.2, 20] } },
      { name: 'Iron Output', description: 'In-game. 5★: +40% at +2 up to +250% at +8; 6★: +125/160/200/300% from +5 to +8.', requirement: 'Active while owned (in-game)', stat: 'resourceOutput', unit: '%',
        tiers: { '5': [null, null, 40, 60, 80, 100, 125, 150, 250], '6': [null, null, null, null, null, 125, 160, 200, 300] } },
      { name: 'Troop HP (Passive)', description: 'In-game, applies to all troops once unlocked. 5★: +16% at +2 up to +80% at +8; 6★: +50/70/85/150% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 16, 24, 32, 40, 50, 65, 80], '6': [null, null, null, null, null, 50, 70, 85, 150] } },
    ],
    m3: { name: 'Green Embrace', desc: "Deals 200% damage to an enemy and fully restores a random ally's Rage (Rage Regen: Slow). Willbreaker: restores 10% Rage for a random ally each round for 3 rounds. Vitalize: fully restores a random ally's Rage when she dies. Landscape: all allies +10% ATK at battle start (cannot be dispelled). Combat Mastery (6★): Crit +30%. Values as shown in-game at 6★ +8.", charge: 'Slow', pattern: 'Single target', effects: ['Rage up', 'ATK up', 'Crit'] },
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
    name: 'Rodriguez', title: 'Desert Gunner', element: 'Light', rarity: 5, unit: 'Infantry', role: 'Team ATK buffer',
    march: [
      ['Troop skill', 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).'],
      ...militaryTrio('Troop', ALL_TROOP_5STAR_MILITARY).map(([n, d]) => [n, n === 'Troop DEF' ? `${d} Unlocks at Lv. 31.` : n === 'Troop ATK' ? `${d} Unlocks at Lv. 131.` : d] as [string, string]),
    ],
    m3: { name: 'Pledge of Victory', desc: 'All allies ATK +70% and Hit −35% (Rage Regen: Medium). Art of Command (unlocks Lv. 11): the Hit penalty drops from 35% to 25%. Kingly Prowess (unlocks Lv. 31): enemies ATK −20% for 5 rounds. Faith Deprivation (unlocks Lv. 71): dispels all buffs enemies gained from active skills. Unbending (unlocks at 6★): Parry +30%. Values as shown in-game at +1.', charge: 'Medium', pattern: 'All allies', effects: ['ATK up', 'Hit down', 'ATK down', 'Dispel', 'Parry'] },
    sources: ['Hero Plaza', 'Mythic Hero Covenant', 'Personal Activity', 'Recruit Trial', 'Timeless Recruitment'], bonds: ['Rhapsody of Genesis'],
    notes: 'Team buffer: +70% ATK for all allies. Bi-weekly Personal Activity shards make him a free long-term hero.',
  }),
  hero({
    name: 'Freya', title: 'Valkyrie', element: 'Nature', rarity: 5, unit: 'Archer', role: 'Single-target damage and Stun',
    march: [
      ['Troop skill', 'Deals damage equal to 150% of troop ATK to the enemy (at +2, in-game).'],
      ...militaryTrio('Troop', ALL_TROOP_5STAR_MILITARY).map(([n, d]) => [n, n === 'Troop DEF' ? `${d} Unlocks at Lv. 31.` : n === 'Troop ATK' ? `${d} Unlocks at Lv. 131.` : d] as [string, string]),
    ],
    m3: { name: 'Quaking Shot', desc: 'Deals 300% damage to the target and Stuns it for 2 rounds (Rage Regen: Medium). Shield Erosion (unlocks Lv. 11): target and adjacent enemies DEF −30% for 4 rounds. Will of Elf (unlocks Lv. 31): immune to debuffs for 3 rounds (cannot be dispelled). Vigor of Cosmos (unlocks Lv. 71): deals 40% more damage to Dark enemies (cannot be dispelled). Target Weakness (unlocks at 6★): Break +30%. Values as shown in-game at +2.', charge: 'Medium', pattern: 'Single target', effects: ['Stun', 'DEF down', 'Debuff immunity', 'Bonus vs Dark', 'Break'] },
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
    m3: { name: 'Inferno Breath', desc: 'Deals 161% damage to all enemies (Rage Regen: Slow). Draconic Flames: Poison damage to enemies for 6 rounds. Drake Companion: all allies ATK +34% for 6 rounds. Sunset Explosion (unlocks Lv. 71): self-detonates on death for 140% damage to all enemies. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at +1.', charge: 'Slow', pattern: 'All enemies', effects: ['Poison', 'ATK up', 'Death explosion', 'Crit'] },
    sources: ['Timeless Recruitment'], bonds: ['Octet Wanderers'],
    notes: 'Training speed and cost cuts work just by owning her. Shards also sold in the Sapphire Shop (350,000 each).',
  }),
  hero({
    name: 'Carvell', title: 'Arcane Engineer', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).']],
    civil: [
      { name: 'Research Speed', description: 'In-game. 5★: +6% at Hero0, then 12/18/24/30/37.5/45/75% from +2 to +8; 6★: 37.5/48/56/100% from +5 to +8.', requirement: 'Active while owned (in-game)', stat: 'researchSpeed', unit: '%', tiers: { '5': [6, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Training Speed', description: 'In-game. 5★: +6% at Hero0, then 12/18/24/30/37.5/45/75% from +2 to +8; 6★: 37.5/48/56/100% from +5 to +8.', requirement: 'Active while owned (in-game)', stat: 'trainSpeed', unit: '%', tiers: { '5': [6, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Troop Capacity', description: 'In-game. 5★: +4,000 at Hero0, then +8,000 at +2 up to +41,250 at +8; 6★: +25,000 at +5 up to +55,000 at +8.', requirement: 'Unlocks at level 131 (in-game)', stat: 'troopCap', unit: 'flat',
        tiers: { '5': [4000, null, 8000, 12000, 16000, 20000, 25000, 30000, 41250], '6': [null, null, null, null, null, 25000, 32000, 37500, 55000] } },
    ],
    m3: { name: 'Holy Verdict', desc: 'Deals 300% damage to the target and adjacent enemies (Rage Regen: Fast). Holy Verdict (enhancement): target DEF −44% for 4 rounds. Wallop: target Heal Rate −50% for 4 rounds. Sacred Asylum (unlocks Lv. 71): DEF +48% to him and adjacent allies for 5 rounds. Target Weakness (unlocks at 6★): Break +30%. Values as shown in-game at Hero0.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['DEF down', 'Heal down', 'DEF up', 'Break'] },
    sources: ['Astrology', 'Feast of Destiny / Wonder House', 'Pyramid Event', 'AP Event', 'Timeless Recruitment'], bonds: ['Sanguine Serenade'],
    notes: 'Research and training speed work just by owning him; appears in many event pools.',
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
    name: 'Apan', title: 'Wind Rider', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Counterattack tank',
    march: [...militaryTrio('Infantry')],
    m3: { name: 'Peace of Mind', desc: 'For 4 rounds, whenever he or adjacent allies are attacked he counterattacks with 125% of the damage received (Rage Regen: Medium). Perseverance: restores 5% HP to him and adjacent allies each round for 4 rounds. Virtuous Commitment: his DEF against Nature enemies +46% for 4 rounds (cannot be dispelled). Silver Lining: takes 50% less damage when HP is below 60% (cannot be dispelled). Unbending (unlocks at 6★): Parry +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Self + adjacent', effects: ['Counterattack', 'Heal over time', 'DEF up', 'Damage reduction', 'Parry'] },
    sources: ['Arms Race Ace Card'], bonds: ['Octet Wanderers'],
    notes: 'Arms Race Ace Card option from realm day 1.',
  }),
  hero({
    name: 'Patty', title: 'Sweet Saboteur', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Resource Gather Speed', description: 'In-game. 5★: +12% at +2 up to +75% at +8; 6★: +37.5% at +5 up to +100% at +8.', requirement: 'Active while owned (in-game)', stat: 'gatherSpeed', unit: '%',
        tiers: { '5': [null, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Rally ATK', description: 'In-game. 5★: +20% at +2 up to +113% at +8; 6★: +66.5% at +5 up to +150% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 20, 31.5, 42.5, 53, 66.5, 80, 113], '6': [null, null, null, null, null, 66.5, 85, 100, 150] } },
      { name: 'Troop Capacity', description: 'In-game. 5★: +3,200 at +2 up to +18,750 at +8; 6★: +10,000 at +5 up to +25,000 at +8.', requirement: 'Active while owned (in-game)', stat: 'troopCap', unit: 'flat',
        tiers: { '5': [null, null, 3200, 4800, 6400, 8000, 10000, 12000, 18750], '6': [null, null, null, null, null, 10000, 12500, 15000, 25000] } },
    ],
    m3: { name: "Queen's Might", desc: "Prevents the target from restoring Rage for 4 rounds (Rage Regen: Medium). Brilliance of Life: restores 26% HP for all allies. Golden Code: at battle start, Light allies restore 5% Rage per round for 6 rounds. Desert Protection: all allies immune to new debuffs for 2 rounds (cannot be dispelled). Iron Will (unlocks at 6★): Crit Res. +30%. Values as shown in-game at 6★ +8.", charge: 'Medium', pattern: 'Single target', effects: ['Rage block', 'Heal', 'Rage up', 'Debuff immunity', 'Crit Res.'] },
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
    march: [['Troop skill', 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).']],
    civil: [
      { name: 'Medical Tent Healing Speed', description: 'In-game. 5★: +6% at Hero0, then 12/18/24/30/37.5/45/75% from +2 to +8; 6★: 37.5/48/56/100% from +5 to +8.', requirement: 'Active while owned (in-game)', stat: 'healSpeed', unit: '%',
        tiers: { '5': [6, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Heal Iron Cost', description: 'In-game. 5★: −4% at Hero0, then −8/−12/−16/−20/−25/−30/−32% from +2 to +8; 6★: −25/−32/−35/−36% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [-4, null, -8, -12, -16, -20, -25, -30, -32], '6': [null, null, null, null, null, -25, -32, -35, -36] } },
      { name: 'Troop Capacity', description: 'In-game. 5★: +4,000 at Hero0, then +8,000 at +2 up to +41,250 at +8; 6★: +25,000 at +5 up to +55,000 at +8.', requirement: 'Unlocks at level 131 (in-game)', stat: 'troopCap', unit: 'flat',
        tiers: { '5': [4000, null, 8000, 12000, 16000, 20000, 25000, 30000, 41250], '6': [null, null, null, null, null, 25000, 32000, 37500, 55000] } },
    ],
    m3: { name: 'Shield of Sincerity', desc: 'Enters a defensive stance for 4 rounds: damage taken is reduced to 1 (except counterattack damage), immune to all statuses, cannot gain Rage (Rage Regen: Fast). Sword of Dragon Fire: in the stance, ATK +85% for 4 rounds. Dragon\'s Gaze: in the stance, Crit Rate +20% for 4 rounds. Indomitable Rage (unlocks Lv. 71): deals 200% damage to enemies on death. Unbending (unlocks at 6★): Parry +30%. Values as shown in-game at Hero0.', charge: 'Fast', pattern: 'Self', effects: ['Damage immunity', 'Status immunity', 'ATK up', 'Crit Rate up', 'Death explosion', 'Parry'] },
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
    march: [],
    civil: [
      { name: 'Infantry ATK (Passive)', description: 'In-game, applies while you own her. 5★: +24% at +2 up to +150% at +8; 6★: +75% at +5 up to +200% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
      { name: 'Cavalry ATK (Passive)', description: 'In-game, applies while you own her. 5★: +24% at +2 up to +150% at +8; 6★: +75% at +5 up to +200% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
      { name: 'Archer ATK (Passive)', description: 'In-game, applies while you own her. 5★: +24% at +2 up to +150% at +8; 6★: +75% at +5 up to +200% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 24, 36, 48, 60, 75, 90, 150], '6': [null, null, null, null, null, 75, 90, 120, 200] } },
    ],
    m3: { name: 'Wrath of Storm', desc: 'Deals 440% damage to the target (Rage Regen: Medium). Raging Wind: steals the target\'s HP restoration for 3 rounds (cannot be dispelled). Cleansing Air: dispels all buffs on enemies. Wind of Tranquility: Ice allies +10% Crit Rate for 4 rounds (cannot be dispelled). Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Single target', effects: ['Heal steal', 'Dispel', 'Crit Rate up', 'Crit'] },
    sources: ['Feast of Destiny / Wonder House', 'Oblivion War Shop'],
    notes: 'Divination Crystals expire — spend all of them before Feast of Destiny / Wonder House ends.',
  }),
  hero({
    name: 'Ogremire', title: 'Swamp Tyrant', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Scramble Troop HP', description: 'In-game: troop HP bonus in Scramble / contest fights, active once unlocked while you own him. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Scramble Troop DEF', description: 'In-game: troop DEF bonus in Scramble / contest fights, active once unlocked while you own him. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Scramble Troop ATK', description: 'In-game: troop ATK bonus in Scramble / contest fights, active once unlocked while you own him. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
    ],
    m3: { name: 'Savage Strike', desc: 'Deals 280% damage to the target and nearby enemies (Rage Regen: Fast). Biting Frost: Freeze damage to the target and adjacent enemies for 3 rounds. Icebound Power: stops HP regen of the target and adjacent enemies for 3 rounds. Ancestral Spirit: self-detonates on death, reducing all enemies\' Rage by 15%. Unbending (6★): Parry +30%. Values as shown in-game at 6★ +8.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['Freeze damage', 'Heal block', 'Rage down', 'Parry'] },
    sources: ['Shadow Expedition'],
    notes: 'Shadow Expedition reward shards.',
  }),
  hero({
    name: 'Neptune', title: 'Lord of Tides', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Troop HP (Passive)', description: 'In-game, applies to all troops once unlocked. 5★: +12.8% at +2 up to +94% at +8; 6★: +40/51.2/75/125% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops once unlocked. 5★: +12.8% at +2 up to +94% at +8; 6★: +40/51.2/75/125% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop ATK (Passive)', description: 'In-game, applies to all troops once unlocked. 5★: +12.8% at +2 up to +94% at +8; 6★: +40/51.2/75/125% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
    ],
    m3: { name: "Neptune's Wrath", desc: 'Deals 450% damage to the target (Rage Regen: Fast). Dark Tide: target and adjacent enemies Rage Regen −24% for 6 rounds. Hidden Reef: Ice members ATK and DEF +5% for 6 rounds from battle start. Warm Current: all members ATK +10% for 6 rounds from battle start. Combat Mastery (6★): Crit +30%. Values as shown in-game at 6★ +8.', charge: 'Fast', pattern: 'Single target', effects: ['Rage down', 'ATK up', 'DEF up', 'Crit'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Stamina Event drops expire.',
  }),
  hero({
    name: 'Kaira', title: 'Coral Priestess', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Troop HP (Passive)', description: 'In-game, applies to all troops while you own her. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops while you own her. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
      { name: 'Troop ATK (Passive)', description: 'In-game, applies to all troops while you own her. 5★: +12.8% at +2 up to +94% at +8; 6★: +40% at +5 up to +125% at +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 12.8, 19.2, 25.6, 32, 40, 51.2, 94], '6': [null, null, null, null, null, 40, 51.2, 75, 125] } },
    ],
    m3: { name: "Destiny's Gift", desc: "Allies recover 44% HP (Rage Regen: Medium). Fate's Barrier: extra healing of 20% of max HP for herself and nearby allies; overhealing becomes a shield. Power of Destiny: allies with the shield gain a little Rage each round and are immune to Rage reduction. Child of Destiny: at battle start, all members' ATK +10% for 6 rounds. Iron Will (unlocks at 6★): Crit Res. +30%. Values as shown in-game at 6★ +8.", charge: 'Medium', pattern: 'All allies', effects: ['Heal', 'Shield', 'Rage up', 'Rage-reduction immunity', 'ATK up', 'Crit Res.'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Her Troop HP, DEF and ATK bonuses apply to all troops just by owning her (+125% each at 6★ +8).',
  }),
  hero({
    name: 'Sea Goddess', title: 'Mother of Waves', element: 'Nature', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Rally HP', description: 'In-game: rally troop HP bonus, active once unlocked while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Rally DEF', description: 'In-game: rally troop DEF bonus, active once unlocked while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
      { name: 'Rally ATK', description: 'In-game: rally troop ATK bonus, active once unlocked while you own her. 5★: +30% at +2 up to +169% at +8; 6★: +95/120/135/225% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [null, null, 30, 45, 60, 75, 95, 110, 169], '6': [null, null, null, null, null, 95, 120, 135, 225] } },
    ],
    m3: { name: 'Springing', desc: 'Deals 260% damage to the target and adjacent enemies with a chance to Stun them for 2 rounds (Rage Regen: Medium). Water Erosion: target and adjacent enemies ATK −30% for 4 rounds. Divinity: she and adjacent allies gain debuff immunity for 3 rounds. Purification: gains 30% Rage at battle start. Target Weakness (6★): Break +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Target + adjacent', effects: ['Stun', 'ATK down', 'Debuff immunity', 'Rage up', 'Break'] },
    sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Freeze is ignored by Elemental Seal bosses from Round 11+.',
  }),
  hero({
    name: 'Leona', title: 'Pride Huntress', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [['Troop skill', 'Deals damage equal to 100% of troop ATK to the enemy (at Hero0, in-game).']],
    civil: [
      { name: 'Safe Resources', description: 'In-game. 5★: +1.2% at Hero0, then 2.4/3.6/4.8/6/7.5/9/15% from +2 to +8; 6★: 7.5/9.6/11.2/20% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [1.2, null, 2.4, 3.6, 4.8, 6, 7.5, 9, 15], '6': [null, null, null, null, null, 7.5, 9.6, 11.2, 20] } },
      { name: 'Reinforcement March Speed', description: 'In-game. 5★: +6% at Hero0, then 12/18/24/30/37.5/45/75% from +2 to +8; 6★: 37.5/48/56/100% from +5 to +8.', requirement: 'Active while owned (in-game)', unit: '%',
        tiers: { '5': [6, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 56, 100] } },
      { name: 'Troop ATK (Passive)', description: 'In-game, applies to all troops while you own her. 5★: +8% at Hero0, then 16/24/32/40/50/65/80% from +2 to +8; 6★: 50/70/85/150% from +5 to +8.', requirement: 'Unlocks at level 131 (in-game)', unit: '%',
        tiers: { '5': [8, null, 16, 24, 32, 40, 50, 65, 80], '6': [null, null, null, null, null, 50, 70, 85, 150] } },
    ],
    m3: { name: 'Justice from Heaven', desc: 'Deals 240% damage to the target and adjacent enemies (Rage Regen: Fast). Sacred Deterrence: a chance to deplete 10% Rage of the target and adjacent enemies for 4 rounds. Dazzling Holy Light: a chance to Stun the target for 2 rounds. Final Blessing (unlocks Lv. 71): allies +20% Damage Bonus for 4 rounds. Combat Mastery (unlocks at 6★): Crit +30%. Values as shown in-game at Hero0.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['Rage down', 'Stun', 'Damage Bonus', 'Crit'] },
    sources: ['AP Event', 'Timeless Recruitment'],
    notes: 'AP Visiting items expire.',
  }),
  hero({
    name: 'Basilong', title: 'Dragonkin', element: 'Ice', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Medical Tent Capacity', description: 'In-game. 5★: +6% at +2 up to +26% at +8; 6★: +18.75/24/28/35% from +5 to +8.', requirement: 'Active from obtaining the hero (in-game rule)', unit: '%',
        tiers: { '5': [null, null, 6, 9, 12, 15, 18.75, 22.5, 26], '6': [null, null, null, null, null, 18.75, 24, 28, 35] } },
      { name: 'Heal Stone Cost', description: 'In-game. 5★: −8% at +2, −12/−16/−20/−25/−30% to −32% at +8; 6★: −25/−30/−33/−36% from +5 to +8.', requirement: 'Unlocks at level 31', unit: '%',
        tiers: { '5': [null, null, -8, -12, -16, -20, -25, -30, -32], '6': [null, null, null, null, null, -25, -30, -33, -36] } },
      { name: 'Troop DEF (Passive)', description: 'In-game, applies to all troops once unlocked. 5★: +16% at +2 up to +80% at +8; 6★: +50/70/85/150% from +5 to +8.', requirement: 'Unlocks at level 131', unit: '%',
        tiers: { '5': [null, null, 16, 24, 32, 40, 50, 65, 80], '6': [null, null, null, null, null, 50, 70, 85, 150] } },
    ],
    m3: { name: 'Soul Blast', desc: 'Deals 290% damage to the target and adjacent enemies (Rage Regen: Medium). Soul Drainer: gains 30% Rage when an enemy dies. Void Realm: all allies immune to Burn and Poison for 3 rounds. Chilling Breath: Ice allies gain 20% Rage at battle start. Unbending (6★): Parry +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'Target + adjacent', effects: ['Rage up', 'Burn/Poison immunity', 'Parry'] },
    sources: ['Lucky Flip'],
    notes: 'Lucky Coins do not expire — save them across Lucky Flip runs.',
  }),
  hero({
    name: 'Edmund', title: 'Gilded Knight', element: 'Light', rarity: 5, unit: 'Civil', role: 'Civil — passive skills',
    march: [],
    civil: [
      { name: 'Food Output', description: 'In-game. 5★: +9.6% at +2 up to +38% at +8; 6★: +30/38.4/40/50% from +5 to +8.', requirement: 'Active from obtaining the hero (in-game rule)', stat: 'resourceOutput', unit: '%',
        tiers: { '5': [null, null, 9.6, 14.4, 19.2, 24, 30, 36, 38], '6': [null, null, null, null, null, 30, 38.4, 40, 50] } },
      { name: 'Medical Tent Healing Speed', description: 'In-game. 5★: +12% at +2 up to +75% at +8; 6★: +37.5/48/60/100% from +5 to +8.', requirement: 'Unlocks at level 31', stat: 'healSpeed', unit: '%',
        tiers: { '5': [null, null, 12, 18, 24, 30, 37.5, 45, 75], '6': [null, null, null, null, null, 37.5, 48, 60, 100] } },
      { name: 'Medical Tent Capacity', description: 'In-game. 5★: +6% at +2 up to +26% at +8; 6★: +18.75/24/28/35% from +5 to +8.', requirement: 'Unlocks at level 131', unit: '%',
        tiers: { '5': [null, null, 6, 9, 12, 15, 18.75, 22.5, 26], '6': [null, null, null, null, null, 18.75, 24, 28, 35] } },
    ],
    m3: { name: 'Hammer of Retribution', desc: 'Deals 300% damage to the target and adjacent enemies and drains 25% of their Rage (Rage Regen: Fast). Sacred Purification: dispels all debuffs on allies and all buffs on enemies. Steadfast Faith: immune to Stun and Paralysis until revived. Resurgence of Light: at battle start Light allies get Wedjat Eye, a 50% chance to revive on death at the cost of 10% HP. Target Weakness (6★): Break +30%. Values as shown in-game at 6★ +8.', charge: 'Fast', pattern: 'Target + adjacent', effects: ['Rage down', 'Dispel', 'Stun immunity', 'Revive', 'Break'] },
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
    name: 'Selantia', title: 'Moon Priestess', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Board-clear damage',
    march: [['Infantry ATK', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350% (+30% at +1). Applies when she joins troop battle (in-game).'], ['Cavalry ATK', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350% (+30% at +1). Applies when she joins troop battle (in-game).'], ['Troop DEF', '5★ +2 to +8: 40/60/90/120/150/200/250%; 6★ +5 to +8: 150/220/280/350% (+30% at +1). Applies when she joins troop battle (in-game). Applies to all troops.']],
    m3: { name: 'Dark Descends', desc: 'Eliminates 1 random row and 1 random column of pieces, each piece dealing 220% damage (no Rage gained from this), and the defender deals 255% area damage (Rage Regen: Medium). Lunar Brilliance: the cleared pieces do not raise enemy Rage. Crescent Blessing (passive): a chance to turn a piece into a bomb when using a skill. Power of Obliteration (Lv. 71): on death clears all pieces, each dealing 80% damage (once per battle). Unbending (6★): Parry +30%. Values as shown in-game at 5★ +1.', charge: 'Medium', pattern: 'Row + column', effects: ['Board clear', 'Bomb', 'Parry'] },
    sources: ["Glory's Gift Roulette"],
    notes: "Glory's Gift Roulette pool.",
  }),
  hero({
    name: 'Eric', title: 'Sword Saint', element: 'Dark', rarity: 5, unit: 'Infantry', role: 'AoE damage and team ATK',
    march: [...militaryTrio('Troop', ALL_TROOP_5STAR_MILITARY)],
    m3: { name: 'Stygian Nova', desc: 'Deals 220% damage to all enemies (Rage Regen: Medium). Soul Drainer: converts 30% of damage dealt into HP. Full Control: a chance to raise allies\' ATK by 100% for 2 rounds (cannot be dispelled). Darkest Hour: Dark allies restore 5% Rage per round for 6 rounds from battle start. Combat Mastery (6★): Crit +30%. Values as shown in-game at 6★ +8.', charge: 'Medium', pattern: 'All enemies', effects: ['Lifesteal', 'ATK up', 'Rage up', 'Crit'] },
    sources: ['Lucky Spin', 'Timeless Recruitment'],
    notes: 'Lucky Spin pool on newer realms.',
  }),
  // ------------------------------ Civil / Economy ------------------------------
  hero({
    name: 'William', title: 'Master Builder', element: 'Dark', rarity: 2, unit: 'Civil', role: 'Construction',
    march: [],
    civil: [
      { name: 'Iron Output', description: 'In-game. 2★: +4% at +2, +6% at +3, +8% at +4, +10% at +5.', requirement: 'Active while owned (in-game)', stat: 'resourceOutput', unit: '%', tiers: { '2': [null, null, 4, 6, 8, 10] } },
      { name: 'Construction Food Cost', description: 'In-game. 2★: −40,000 at +2, −60,000 at +3, −80,000 at +4, −100,000 at +5 food per construction.', requirement: 'Unlocks at level 11', stat: 'buildCost', unit: 'flat', tiers: { '2': [null, null, -40000, -60000, -80000, -100000] } },
      { name: 'Construction Wood Cost', description: 'In-game. 2★: −40,000 at +2, −60,000 at +3, −80,000 at +4, −100,000 at +5 wood per construction.', requirement: 'Unlocks at level 31', stat: 'buildCost', unit: 'flat', tiers: { '2': [null, null, -40000, -60000, -80000, -100000] } },
    ],
    m3: { name: 'Spinning Axe', desc: 'Deals 138% damage to all enemies (Rage Regen: Medium). Raging Slash (unlocks Lv. 11): ATK and DEF +8%. Values as shown in-game at +5.', charge: 'Medium', pattern: 'All enemies', effects: ['ATK up', 'DEF up'] },
    sources: ['Hero Plaza', 'Starter / Campaign'],
    notes: 'Own-only construction cost reduction. Enhance before big Citadel pushes.',
  }),
  hero({
    name: 'Chloe', title: 'Quartermaster', element: 'Dark', rarity: 3, unit: 'Civil', role: 'Construction',
    march: [['Troop skill', 'Deals damage equal to 200% of troop ATK to the enemy (at +3, in-game).']],
    civil: [
      { name: 'Free Speedup Time', description: 'In-game. 3★: 4 min at +2, 6 at +3, 8 at +4, 10 at +5.', requirement: 'Active while owned (in-game)', unit: 'min',
        tiers: { '3': [null, null, 4, 6, 8, 10] } },
      { name: 'Construction Stone Cost', description: 'In-game. 3★: −40,000 at +2, −60,000 at +3, −80,000 at +4, −100,000 at +5 stone per construction.', requirement: 'Unlocks at level 31 (in-game)', stat: 'buildCost', unit: 'flat',
        tiers: { '3': [null, null, -40000, -60000, -80000, -100000] } },
      { name: 'Construction Iron Cost', description: 'In-game. 3★: −20,000 at +2, −30,000 at +3, −40,000 at +4, −50,000 at +5 iron per construction.', requirement: 'Unlocks at level 71 (in-game)', stat: 'buildCost', unit: 'flat',
        tiers: { '3': [null, null, -20000, -30000, -40000, -50000] } },
    ],
    m3: { name: 'Blight', desc: 'Deals 316% damage to the target (Rage Regen: Medium). Bloodthirsty Touch (unlocks Lv. 11): converts 70% of the damage dealt into HP. Elemental Resonance (unlocks Lv. 31): ATK and Crit +10%. Values as shown in-game at +3.', charge: 'Medium', pattern: 'Single target', effects: ['Lifesteal', 'ATK up', 'Crit'] },
    sources: ['Hero Plaza', 'Superb Hero Covenant', 'Hero Recruitment'],
    notes: 'Stacks with William — both cost reductions are additive.',
  }),
  hero({
    name: 'Elsa', title: 'Frost Architect', element: 'Dark', rarity: 4, unit: 'Civil', role: 'Construction speed',
    march: [['Troop skill', 'Deals damage equal to 120% of troop ATK to the enemy (at +1, in-game).']],
    civil: [
      { name: 'Construction Speed', description: 'In-game. 4★: +3% at Hero0, +4.5% at +1, +6% at +2, +9% at +3, +12% at +4, +15% at +5.', requirement: 'Active while owned (in-game)', stat: 'buildSpeed', unit: '%',
        tiers: { '4': [3, 4.5, 6, 9, 12, 15] } },
      { name: 'Iron Output', description: 'In-game. 4★: +20% at Hero0, +30% at +1, +40% at +2, +60% at +3, +80% at +4, +100% at +5.', requirement: 'Unlocks at level 31 (in-game)', stat: 'resourceOutput', unit: '%',
        tiers: { '4': [20, 30, 40, 60, 80, 100] } },
      { name: 'Rally Size', description: 'In-game. 4★: +20,000 at Hero0, +30,000 at +1, +40,000 at +2, +60,000 at +3, +80,000 at +4, +100,000 at +5.', requirement: 'Unlocks at level 131 (in-game)', unit: 'flat',
        tiers: { '4': [20000, 30000, 40000, 60000, 80000, 100000] } },
    ],
    m3: { name: 'Darktide', desc: 'Deals 149% damage to all enemies (Rage Regen: Medium). Soul Shackles: enemies ATK −28% for 5 rounds. Death\'s Anthem: ATK +15% and Rage Regen +8%. Ice Blade (unlocks Lv. 71): depletes 20% Rage of enemies. Values as shown in-game at +1.', charge: 'Medium', pattern: 'All enemies', effects: ['ATK down', 'ATK up', 'Rage up', 'Rage down'] },
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
 * revision 19 = in-game Fiona skills; revision 20 = in-game Setemos skills;
 * revision 21 = in-game Leona skills; revision 22 = in-game Tutanhet skills;
 * revision 23 = in-game Lylia skills; revision 24 = in-game Tooka skills;
 * revision 25 = in-game Carvell skills; revision 26 = in-game Kaios skills;
 * revision 27 = in-game Dolly skills; revision 28 = in-game Elsa skills;
 * revision 29 = in-game Wallace skills; revision 30 = in-game Cassandra skills;
 * revision 31 = in-game Claudia skills.
 */
export const HERO_DATA_REVISION = 63; // 63 = in-game Selantia and Ogremire // 62 = in-game Sea Goddess and Valerius // 61 = in-game Tala; Infernal Tooka sources // 60 = in-game Kanye, Guan Yu, Infernal Tooka // 59 = in-game Neptune // 58 = in-game Eric; Basilong Medical Tent Capacity // 57 = in-game Edmund; Basilong 1st skill = Medical Tent Capacity // 56 = in-game Basilong // 55 = in-game Hannah // 54 = in-game Gerolin, Roger and Lucia // 53 = in-game Ada and Axel // 52 = in-game 2★ heroes (William, Baron, Luke, Sophia, Penny) and 2★ unlock rule // 51 = in-game Penny skills // 50 = in-game Andre and Viola skills // 49 = in-game Capos skills // 48 = in-game Schubert skills // 47 = unlock rules for 3★, 4★ and 6★ heroes // 46 = 5★ unlock levels (31/131 troop, 11/31/71/6★ hero skills) // 45 = in-game Monica skills // 44 = in-game Apan and Echo skills // 43 = in-game Anastasia skills // 42 = in-game Patty skills // 41 = Kaios 6★ +8 check // 40 = in-game Kaira skills // 39 = Elsa Hero0 values and Iron Output unlock level // 38 = in-game Tulios skills // 37 = shared main troop skill table (max 500% at +5) // 36 = in-game Aemon skills // 35 = in-game Chloe skills // 34 = in-game Rodriguez skills // 33 = in-game Hanzo skills // 32 = in-game Freya skills

/**
 * Every hero's main troop skill follows the same table (confirmed by the player across many heroes):
 * 100% of troop ATK at Hero0, 120% at +1, 150% at +2, 200% at +3, 300% at +4 and 500% at +5. It stops at +5.
 */
export const MAIN_TROOP_SKILL = { name: 'Troop skill', description: 'Deals damage equal to a share of troop ATK to the enemy: 100% at Hero0, 120% at +1, 150% at +2, 200% at +3, 300% at +4, 500% at +5. Maximum 500%: it does not increase at +6 to +8.' };

const withMainTroopSkill = (h: Hero): Hero => ({ ...h, marchSkills: [MAIN_TROOP_SKILL, ...h.marchSkills.filter((m) => m.name !== 'Troop skill' && m.name !== 'Skill')] });

/**
 * Skill unlock rules by star rating (confirmed in-game by the player). The skills listed under the main troop
 * skill unlock in order: 4★–6★ heroes get the 1st on obtaining, the 2nd at Lv. 31 and the 3rd at Lv. 131;
 * 3★ heroes get the 1st on obtaining, then Lv. 31 and Lv. 71. Hero skills unlock at Lv. 11, 31 and 71 after
 * the first, plus a 5th at 6★ (5★ heroes) or 7★ (6★ heroes); 4★ heroes have four, 3★ heroes three.
 * Levels already stated for a skill are kept; the remaining slots are filled in order.
 */
const TROOP_SLOTS: Record<number, (number | null)[]> = { 2: [null, 11, 31], 3: [null, 31, 71], 4: [null, 31, 131], 5: [null, 31, 131], 6: [null, 31, 131] };
const HERO_SKILL_UNLOCKS: Record<number, string> = {
  3: 'Unlocks: 1st skill on obtaining the hero, 2nd at Lv. 11, 3rd at Lv. 31.',
  4: 'Unlocks: 1st skill on obtaining the hero, 2nd at Lv. 11, 3rd at Lv. 31, 4th at Lv. 71.',
  5: 'Unlocks: 1st skill on obtaining the hero, 2nd at Lv. 11, 3rd at Lv. 31, 4th at Lv. 71, 5th at 6★.',
  6: 'Unlocks: 1st skill on obtaining the hero, 2nd at Lv. 11, 3rd at Lv. 31, 4th at Lv. 71, 5th at 7★.',
};
const OWNED_REQ = 'Active from obtaining the hero (in-game rule)';
const levelIn = (t: string) => { const m = /level\s+(\d+)/i.exec(t); return m ? Number(m[1]) : null; };
const lvIn = (t: string) => { const m = /unlocks at lv\.\s*(\d+)/i.exec(t); return m ? Number(m[1]) : null; };

function withUnlockRules(h: Hero): Hero {
  const slots = TROOP_SLOTS[h.rarity];
  if (!slots) return h;
  const stats = h.marchSkills.filter((m) => m.name !== 'Troop skill');
  // Game order: civil skills, then in-battle stat skills.
  const items: ({ kind: 'civil'; i: number; lvl: number | null } | { kind: 'march'; m: typeof stats[number]; lvl: number | null })[] = [
    ...h.civilSkills.map((c, i) => ({ kind: 'civil' as const, i, lvl: levelIn(c.requirement) })),
    ...stats.map((m) => ({ kind: 'march' as const, m, lvl: lvIn(m.description) })),
  ];
  let civilSkills = h.civilSkills;
  let marchSkills = h.marchSkills;
  if (items.length === 3) {
    const used = new Set(items.map((x) => x.lvl).filter((n): n is number => n !== null));
    const free = slots.filter((l) => l === null || !used.has(l));
    let k = 0;
    const assigned = new Map<unknown, number | null>();
    for (const it of items) if (it.lvl === null && !(it.kind === 'march' && k === 0 && free[0] === null && false)) assigned.set(it, free[k++] ?? null);
    civilSkills = h.civilSkills.map((c, i) => {
      const it = items.find((x) => x.kind === 'civil' && x.i === i)!;
      if (!assigned.has(it)) return c;
      const lvl = assigned.get(it)!;
      return { ...c, requirement: lvl === null ? OWNED_REQ : `Unlocks at level ${lvl}`, description: c.description.replace(/(applies|active)( to all troops)? while you own (him|her)/i, '$1$2 once unlocked') };
    });
    marchSkills = h.marchSkills.map((m) => {
      const it = items.find((x) => x.kind === 'march' && x.m === m);
      if (!it || !assigned.has(it)) return m;
      const lvl = assigned.get(it)!;
      return lvl === null ? m : { ...m, description: `${m.description} Unlocks at Lv. ${lvl}.` };
    });
  }
  const rule = HERO_SKILL_UNLOCKS[h.rarity];
  const m3 = h.match3Skill && rule && !h.match3Skill.description.includes(h.rarity === 3 ? 'Lv. 31' : 'Lv. 71')
    ? { ...h.match3Skill, description: `${h.match3Skill.description} ${rule}` }
    : h.match3Skill;
  return { ...h, civilSkills, marchSkills, ...(m3 ? { match3Skill: m3 } : {}) };
}

export const heroes: Hero[] = [...baseHeroes, ...lowStarHeroes, ...addedHighStarHeroes].map((h) => withUnlockRules(withMainTroopSkill({ ...h, audit: heroAudit[h.id] ?? h.audit, revision: HERO_DATA_REVISION })));
