import type {
  AcquisitionSource, ChargeSpeed, CivilSkill, Confidence, Element, Hero, HeroSkill, ModeTiers, Rarity, Tier, UnitType,
} from '@/types/game';

interface HeroInput {
  name: string;
  title: string;
  element: Element;
  rarity: Rarity;
  unit: UnitType;
  role: string;
  march: [string, string][];
  civil?: CivilSkill[];
  m3: { name: string; desc: string; charge: ChargeSpeed; pattern: string; effects: string[] };
  tiers: [Tier, Tier, Tier, Tier];
  sources: AcquisitionSource[];
  bonds?: string[];
  curio?: string;
  notes: string;
  confidence?: Confidence;
}

const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function hero(i: HeroInput): Hero {
  const tiers: ModeTiers = { pve: i.tiers[0], pvp: i.tiers[1], boss: i.tiers[2], economy: i.tiers[3] };
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
    tiers,
    sources: i.sources,
    bondGroups: i.bonds ?? [],
    exclusiveCurio: i.curio,
    notes: i.notes,
    confidence: i.confidence ?? 'community',
  };
}

export const heroes: Hero[] = [
  // ------------------------------ 6-Star ------------------------------
  hero({
    name: 'Khaos', title: 'Sovereign of the Rift', element: 'Dark', rarity: 6, unit: 'Cavalry', role: 'Rally lead / burst',
    march: [['Rift Charge', 'Cavalry ATK up while leading a rally; first strike ignores part of enemy DEF.'], ['Void Dominion', 'Reduces enemy Cavalry and Archer DEF during the first rounds of battle.']],
    m3: { name: 'Abyssal Collapse', desc: 'Huge Dark damage to all enemies and lowers their ATK.', charge: 'Slow', pattern: 'All enemies', effects: ['ATK down', 'High single-cast damage'] },
    tiers: ['SS', 'SS', 'S', 'B'], sources: ['Oblivion War Shop', 'Royal Arms Race'], bonds: ['Rhapsody of Genesis'], curio: 'Riftbreaker Lance',
    notes: 'Top-end rally captain for Cavalry mains. Prioritise if you already field Dark hitters.', confidence: 'estimate',
  }),
  hero({
    name: 'Anastasia', title: 'Frost Empress', element: 'Ice', rarity: 6, unit: 'Infantry', role: 'Garrison anchor',
    march: [['Eternal Winter', 'Infantry DEF and HP up; reduces damage taken by the garrison.'], ['Crown of Rime', 'Chance to freeze enemy Cavalry, lowering their damage for 2 rounds.']],
    m3: { name: 'Glacial Coronation', desc: 'Ice damage to all enemies, freezes the front row and shields allies.', charge: 'Medium', pattern: 'All enemies + ally shield', effects: ['Freeze', 'Shield'] },
    tiers: ['S', 'SS', 'A', 'B'], sources: ['Astrology'], bonds: ['Rhapsody of Genesis'], curio: 'Rimecrown Sceptre',
    notes: 'The best Astrology pull for Infantry defence. Summon Scrolls do not expire, so save across events.',
  }),
  hero({
    name: 'Maxim', title: 'Iron Vanguard', element: 'Fire', rarity: 6, unit: 'Infantry', role: 'Frontline bruiser',
    march: [['Ironclad Advance', 'Infantry ATK and DEF up; scales with number of Infantry in the march.'], ['Unbroken Line', 'Reduces damage from Archers to Infantry.']],
    m3: { name: 'Molten Bastion', desc: 'Fire damage to a column and raises team DEF.', charge: 'Medium', pattern: 'Column', effects: ['DEF up'] },
    tiers: ['S', 'S', 'A', 'B'], sources: ['Astrology'], bonds: ['Octet Wanderers'],
    notes: 'Pairs with Anastasia for an Infantry wall that survives Archer-heavy rallies.',
  }),
  hero({
    name: 'Guan Yu', title: 'Saint of War', element: 'Nature', rarity: 6, unit: 'Cavalry', role: 'Open-field duelist',
    march: [['Green Dragon Crescent', 'Cavalry ATK up; extra damage against Infantry.'], ['Righteous Valor', 'Cavalry HP up and reduces enemy counterattack.']],
    m3: { name: 'Azure Dragon Sweep', desc: 'Nature damage in a wide cone and stuns the target for 1 turn.', charge: 'Medium', pattern: 'Cone (3x3)', effects: ['Stun'] },
    tiers: ['S', 'SS', 'A', 'C'], sources: ['Recruit Trial'], curio: 'Azure Dragon Blade',
    notes: 'Recruit Trial probability pool also contains the Azure Dragon Blade Scroll (his exclusive curio).',
  }),
  hero({
    name: 'Saya', title: 'Hearth Steward', element: 'Light', rarity: 6, unit: 'Civil', role: 'Economy core',
    march: [['Warm Welcome', 'Minor troop HP buff when garrisoning the Citadel.']],
    civil: [
      { name: 'Hearthguard Muster', description: 'Increases troop capacity of the castle.', requirement: 'Owned, Enhancement +1', stat: 'troopCap', value: 5 },
      { name: 'Swift Masonry', description: 'Increases construction speed.', requirement: 'Owned, Enhancement +3', stat: 'buildSpeed', value: 8 },
    ],
    m3: { name: 'Sunlit Blessing', desc: 'Heals allies and cleanses one debuff.', charge: 'Fast', pattern: 'All allies', effects: ['Heal', 'Cleanse'] },
    tiers: ['B', 'C', 'B', 'SS'], sources: ['Ace Lord Radiant Card'],
    notes: 'Own-only skills: you never need to march her. Highest account-wide value per shard in the game.',
  }),
  // ------------------------------ 5-Star ------------------------------
  hero({
    name: 'Tania', title: 'Storm Archer', element: 'Light', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Volley Command', 'Cavalry ATK up; bonus damage vs Infantry.'], ['Thunder Mark', 'Marked enemies take more Cavalry damage.']],
    m3: { name: 'Stormcall Arrows', desc: 'Light damage to random enemies 6 times.', charge: 'Fast', pattern: 'Random x6', effects: ['Multi-hit'] },
    tiers: ['A', 'S', 'S', 'C'], sources: ['Timeless Recruitment'],
    notes: 'Multi-hit pattern is excellent vs bosses with damage-instance caps.',
  }),
  hero({
    name: 'Dimina', title: 'Starlit Oracle', element: 'Light', rarity: 5, unit: 'Archer', role: 'Support caster',
    march: [['Prophecy', 'Archer DEF up and reduces enemy Cavalry ATK.']],
    m3: { name: 'Constellation', desc: 'Boosts ally mana gain and deals Light damage to a row.', charge: 'Fast', pattern: 'Row', effects: ['Mana gain up'] },
    tiers: ['S', 'A', 'A', 'C'], sources: ["Glory's Gift Roulette"],
    notes: 'Lucky Star Coins do not expire — bank them for her banner.',
  }),
  hero({
    name: 'Kanye', title: 'Beat of War', element: 'Fire', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Drumline Charge', 'Cavalry ATK up; first 3 rounds deal extra damage.']],
    m3: { name: 'Bass Drop', desc: 'Fire damage to a 3x3 area and burns for 2 turns.', charge: 'Medium', pattern: '3x3', effects: ['Burn'] },
    tiers: ['A', 'A', 'S', 'C'], sources: ["Glory's Gift Roulette"],
    notes: 'Strong burn damage in Elemental Seal when Fire is a required element.',
  }),
  hero({
    name: 'Norris', title: 'Bulwark Marshal', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Tank',
    march: [['Shield Wall', 'Infantry DEF up; reduces damage from Cavalry.']],
    m3: { name: 'Permafrost Guard', desc: 'Taunts enemies and gains a large shield.', charge: 'Medium', pattern: 'Self + taunt', effects: ['Taunt', 'Shield'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Hero Choice Card pick for early realms (> 4 weeks).',
  }),
  hero({
    name: 'Edith', title: 'Iron Matron', element: 'Nature', rarity: 5, unit: 'Infantry', role: 'Sustain tank',
    march: [['Field Medic', 'Reduces wounded troops in defence; Infantry HP up.']],
    m3: { name: 'Overgrowth', desc: 'Heals allies over 3 turns and raises DEF.', charge: 'Fast', pattern: 'All allies', effects: ['HoT', 'DEF up'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Strike Out', 'Timeless Recruitment'],
    notes: 'Strike Out milestone shards make her the easiest 5-Star tank to max for F2P.',
  }),
  hero({
    name: 'Boyd', title: 'Ember Captain', element: 'Fire', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Burning Hooves', 'Cavalry ATK up; bonus vs Infantry.']],
    m3: { name: 'Flame Charge', desc: 'Fire damage to a row and lowers enemy DEF.', charge: 'Medium', pattern: 'Row', effects: ['DEF down'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Ace Lord Radiant Card'],
    notes: 'Radiant Hero Choice Card option from realm day 1.',
  }),
  hero({
    name: 'Monica', title: 'Silver Lancer', element: 'Light', rarity: 5, unit: 'Cavalry', role: 'Cavalry bruiser',
    march: [['Radiant Lance', 'Cavalry ATK and HP up.']],
    m3: { name: 'Dawn Pierce', desc: 'Light damage to a column; ignores 30% DEF.', charge: 'Medium', pattern: 'Column', effects: ['DEF ignore'] },
    tiers: ['A', 'S', 'A', 'C'], sources: ['Ace Lord Radiant Card'],
    notes: 'Radiant Card option once realm age exceeds 4 weeks.',
  }),
  hero({
    name: 'Kaios', title: 'Tidebinder', element: 'Ice', rarity: 5, unit: 'Archer', role: 'Archer control',
    march: [['Undertow', 'Archer ATK up; slows enemy march speed in the field.']],
    m3: { name: 'Riptide', desc: 'Ice damage to a 3x3 area and freezes for 1 turn.', charge: 'Medium', pattern: '3x3', effects: ['Freeze'] },
    tiers: ['S', 'A', 'A', 'C'], sources: ['Ace Lord Radiant Card', 'AP Event'],
    notes: 'AP Visiting events also feature his shards.',
  }),
  hero({
    name: 'Aerposia', title: 'Sky Sovereign', element: 'Light', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Skyfall', 'Archer ATK up; damage up when attacking structures.']],
    m3: { name: 'Celestial Rain', desc: 'Light damage to all enemies.', charge: 'Slow', pattern: 'All enemies', effects: ['AoE'] },
    tiers: ['S', 'S', 'A', 'C'], sources: ['Ace Lord Radiant Card'],
    notes: 'Radiant Card option after realm age > 22 weeks. Best Archer rally hitter of the card pool.',
  }),
  hero({
    name: 'Valerius', title: 'Crimson Warden', element: 'Fire', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Blood Oath', 'Infantry ATK up; heals a portion of damage dealt.']],
    m3: { name: 'Crimson Cleave', desc: 'Fire damage to a row with lifesteal.', charge: 'Medium', pattern: 'Row', effects: ['Lifesteal'] },
    tiers: ['A', 'S', 'A', 'C'], sources: ['Astrology'], bonds: ['Sanguine Serenade'],
    notes: 'Astrology rate-up hero.',
  }),
  hero({
    name: 'Tala', title: 'Wildheart', element: 'Nature', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Hunter Instinct', 'Archer ATK up; crit chance vs Cavalry.']],
    m3: { name: 'Thornstorm', desc: 'Nature damage to a column and poisons for 3 turns.', charge: 'Fast', pattern: 'Column', effects: ['Poison'] },
    tiers: ['S', 'A', 'S', 'C'], sources: ['Astrology'],
    notes: 'Fast-charging poison makes her a reliable Elemental Seal Nature pick.',
  }),
  hero({
    name: 'Eris', title: 'Discord Blade', element: 'Dark', rarity: 5, unit: 'Cavalry', role: 'Assassin',
    march: [['Sow Discord', 'Lowers enemy ATK; Cavalry crit damage up.']],
    m3: { name: 'Apple of Strife', desc: 'Dark damage to the highest-ATK enemy and silences it.', charge: 'Fast', pattern: 'Single target', effects: ['Silence'] },
    tiers: ['S', 'S', 'B', 'C'], sources: ['Recruit Trial', 'Timeless Recruitment'],
    notes: 'Silence is wasted on Elemental Seal bosses (immune), but dominant in Arena.',
  }),
  hero({
    name: 'Kujo Mamoru', title: 'Shrine Guardian', element: 'Light', rarity: 5, unit: 'Infantry', role: 'Tank',
    march: [['Sacred Barrier', 'Infantry DEF up and reduces skill damage taken.']],
    m3: { name: 'Torii Seal', desc: 'Shields all allies and reflects part of damage.', charge: 'Medium', pattern: 'All allies', effects: ['Shield', 'Reflect'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Strike Out', 'Timeless Recruitment'],
    notes: 'Strike Out milestone shards — easy F2P Infantry defender.',
  }),
  hero({
    name: 'Rodriguez', title: 'Desert Gunner', element: 'Fire', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Powder Keg', 'Archer ATK up; bonus damage vs structures.']],
    m3: { name: 'Dynamite', desc: 'Fire damage to a 3x3 area.', charge: 'Medium', pattern: '3x3', effects: ['AoE'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Personal Activity', 'Recruit Trial', 'Timeless Recruitment'],
    notes: 'Bi-weekly Personal Activity shards make him a free long-term Archer.',
  }),
  hero({
    name: 'Freya', title: 'Valkyrie', element: 'Ice', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Valhalla Ride', 'Cavalry ATK up; extra damage when HP is above 50%.']],
    m3: { name: 'Einherjar', desc: 'Ice damage to a row and grants ally ATK up.', charge: 'Medium', pattern: 'Row', effects: ['ATK up'] },
    tiers: ['S', 'A', 'A', 'C'], sources: ['Lucky Spin', 'Recruit Trial', 'Timeless Recruitment'],
    notes: 'Lucky Spin banner on newer realms.',
  }),
  hero({
    name: 'Fiona', title: 'Grove Keeper', element: 'Nature', rarity: 5, unit: 'All-round', role: 'Healer',
    march: [['Verdant Aura', 'All troop HP up slightly.']],
    m3: { name: 'Bloom', desc: 'Heals all allies by a large amount.', charge: 'Fast', pattern: 'All allies', effects: ['Heal'] },
    tiers: ['S', 'B', 'S', 'C'], sources: ['Timeless Recruitment'],
    notes: 'Best Campaign and boss sustain in the Timeless pool.',
  }),
  hero({
    name: 'Carvell', title: 'Arcane Engineer', element: 'Dark', rarity: 5, unit: 'Archer', role: 'Debuffer',
    march: [['Siege Matrix', 'Archer ATK up vs structures; reduces enemy wall DEF.']],
    m3: { name: 'Overclock', desc: 'Dark damage to a column and lowers enemy mana.', charge: 'Medium', pattern: 'Column', effects: ['Mana drain'] },
    tiers: ['A', 'S', 'A', 'C'], sources: ['Astrology', 'Feast of Destiny / Wonder House', 'Pyramid Event', 'AP Event', 'Timeless Recruitment'],
    notes: 'Appears in many event pools — never spend premium currency on him directly.',
  }),
  hero({
    name: 'Wu Kong', title: 'Monkey King', element: 'Fire', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Seventy-Two Forms', 'Infantry ATK up; chance to dodge.']],
    m3: { name: 'Ruyi Strike', desc: 'Fire damage to a column 3 times.', charge: 'Medium', pattern: 'Column x3', effects: ['Multi-hit'] },
    tiers: ['S', 'A', 'S', 'C'], sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Stamina Event drops expire — spend them before the event ends.',
  }),
  hero({
    name: 'Oichi', title: 'Blossom Blade', element: 'Nature', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Sakura Charge', 'Cavalry ATK up; bonus vs Infantry.']],
    m3: { name: 'Petal Storm', desc: 'Nature damage to all enemies and reduces healing.', charge: 'Slow', pattern: 'All enemies', effects: ['Anti-heal'] },
    tiers: ['A', 'S', 'B', 'C'], sources: ['Hero Plaza'],
    notes: 'Anti-heal is valuable in Arena against Fiona/Edith teams.', confidence: 'estimate',
  }),
  hero({
    name: 'Sirius', title: 'Dog Star', element: 'Light', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Brightest Star', 'Archer ATK up; crit rate up at night-time battles.']],
    m3: { name: 'Stellar Lance', desc: 'Light damage to a single target, high crit.', charge: 'Fast', pattern: 'Single target', effects: ['Crit'] },
    tiers: ['A', 'A', 'S', 'C'], sources: ['Hero Plaza'],
    notes: 'Single-target nuker for bosses.', confidence: 'estimate',
  }),
  hero({
    name: 'Vynora', title: 'Venom Queen', element: 'Dark', rarity: 5, unit: 'Archer', role: 'DoT',
    march: [['Toxic Volley', 'Archer ATK up; poisons on hit.']],
    m3: { name: 'Venom Bloom', desc: 'Dark damage to a 3x3 area and applies stacking poison.', charge: 'Medium', pattern: '3x3', effects: ['Poison'] },
    tiers: ['A', 'A', 'S', 'C'], sources: ['Hero Plaza'],
    notes: 'Poison stacks ignore boss stun/silence immunity.', confidence: 'estimate',
  }),
  hero({
    name: 'Snowball & Ivy', title: 'Frost Twins', element: 'Ice', rarity: 5, unit: 'All-round', role: 'Support',
    march: [['Twin Bond', 'All troop DEF up slightly.']],
    m3: { name: 'Snowball Fight', desc: 'Ice damage to random enemies and freezes one.', charge: 'Fast', pattern: 'Random x4', effects: ['Freeze'] },
    tiers: ['A', 'B', 'A', 'B'], sources: ['Battle Pass'],
    notes: 'Seasonal duo; decent Ice filler.', confidence: 'estimate',
  }),
  hero({
    name: 'Leora', title: 'Lionheart', element: 'Light', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Pride', 'Infantry ATK up; damage up per surviving ally.']],
    m3: { name: 'Roar of Dawn', desc: 'Light damage to a row and raises ally ATK.', charge: 'Medium', pattern: 'Row', effects: ['ATK up'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Hero Plaza'],
    notes: 'Solid Light Infantry for Elemental Seal requirements.', confidence: 'estimate',
  }),
  hero({
    name: 'Apan', title: 'Wind Rider', element: 'Nature', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Gale Charge', 'Cavalry ATK and march speed up.']],
    m3: { name: 'Cyclone', desc: 'Nature damage to a column and pushes enemy mana back.', charge: 'Medium', pattern: 'Column', effects: ['Mana down'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Card option from realm day 1.',
  }),
  hero({
    name: 'Patty', title: 'Sweet Saboteur', element: 'Fire', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Sugar Rush', 'Archer ATK up; attack speed up in the first round.']],
    m3: { name: 'Candy Bomb', desc: 'Fire damage to a 3x3 area and stuns the center target.', charge: 'Medium', pattern: '3x3', effects: ['Stun'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Card option once realm age exceeds 12 weeks.',
  }),
  hero({
    name: 'Angelita', title: 'Seraph of Mercy', element: 'Light', rarity: 5, unit: 'All-round', role: 'Healer',
    march: [['Mercy', 'Reduces troop losses and raises all troop HP.']],
    m3: { name: 'Halo', desc: 'Heals all allies and revives one fallen hero at 30% HP.', charge: 'Slow', pattern: 'All allies', effects: ['Heal', 'Revive'] },
    tiers: ['S', 'S', 'A', 'C'], sources: ['Arms Race Ace Card'],
    notes: 'Arms Race Ace Card option after realm age > 22 weeks — best pick of the late pool.',
  }),
  hero({
    name: 'Lylia', title: 'Moonblade', element: 'Dark', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Lunar Edge', 'Cavalry ATK up; extra damage vs Archers.']],
    m3: { name: 'Crescent Slash', desc: 'Dark damage to a row twice.', charge: 'Fast', pattern: 'Row x2', effects: ['Multi-hit'] },
    tiers: ['A', 'S', 'A', 'C'], sources: ['Royal Arms Race'],
    notes: 'Royal Arms Race ranking reward shards.',
  }),
  hero({
    name: 'Oskir', title: 'Runesmith', element: 'Ice', rarity: 5, unit: 'Infantry', role: 'Tank',
    march: [['Runic Armor', 'Infantry DEF up; damage reduction vs skills.']],
    m3: { name: 'Glyph Ward', desc: 'Shields the front row and reduces enemy ATK.', charge: 'Medium', pattern: 'Front row allies', effects: ['Shield', 'ATK down'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Alliance Duel'],
    notes: 'Alliance Duel reward shards.',
  }),
  hero({
    name: 'Echo', title: 'Whisper of the Void', element: 'Dark', rarity: 5, unit: 'Archer', role: 'Archer DPS',
    march: [['Resonance', 'Archer ATK up; repeats a portion of skill damage.']],
    m3: { name: 'Reverb', desc: 'Dark damage to a column, echoing 50% damage next turn.', charge: 'Medium', pattern: 'Column', effects: ['Delayed hit'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Feast of Destiny / Wonder House', 'Oblivion War Shop'],
    notes: 'Divination Crystals expire — spend all of them before Feast of Destiny / Wonder House ends.',
  }),
  hero({
    name: 'Ogremire', title: 'Swamp Tyrant', element: 'Nature', rarity: 5, unit: 'Infantry', role: 'Tank',
    march: [['Bog Hide', 'Infantry HP up significantly.']],
    m3: { name: 'Mire Slam', desc: 'Nature damage to a 3x3 area and slows mana gain.', charge: 'Slow', pattern: '3x3', effects: ['Mana slow'] },
    tiers: ['B', 'A', 'B', 'C'], sources: ['Shadow Expedition'],
    notes: 'Shadow Expedition reward shards.',
  }),
  hero({
    name: 'Neptune', title: 'Lord of Tides', element: 'Ice', rarity: 5, unit: 'Archer', role: 'AoE',
    march: [['Tidal Force', 'Archer ATK up.']],
    m3: { name: 'Trident Wave', desc: 'Ice damage to all enemies.', charge: 'Slow', pattern: 'All enemies', effects: ['AoE'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Stamina Event drops expire.',
  }),
  hero({
    name: 'Kaira', title: 'Coral Priestess', element: 'Ice', rarity: 5, unit: 'All-round', role: 'Healer',
    march: [['Coral Ward', 'All troop DEF up slightly.']],
    m3: { name: 'Sea Hymn', desc: 'Heals all allies and cleanses freeze/burn.', charge: 'Fast', pattern: 'All allies', effects: ['Heal', 'Cleanse'] },
    tiers: ['A', 'B', 'A', 'C'], sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Cleanse is useful vs Fire burn bosses.',
  }),
  hero({
    name: 'Sea Goddess', title: 'Mother of Waves', element: 'Ice', rarity: 5, unit: 'Archer', role: 'Control',
    march: [['Abyssal Pressure', 'Lowers enemy march speed and Archer DEF.']],
    m3: { name: 'Maelstrom', desc: 'Ice damage to a 3x3 area and freezes for 2 turns.', charge: 'Slow', pattern: '3x3', effects: ['Freeze'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Stamina Event', 'Timeless Recruitment'],
    notes: 'Freeze is ignored by Elemental Seal bosses from Round 11+.',
  }),
  hero({
    name: 'Leona', title: 'Pride Huntress', element: 'Fire', rarity: 5, unit: 'Cavalry', role: 'Cavalry DPS',
    march: [['Hunt', 'Cavalry ATK up; extra damage to wounded enemies.']],
    m3: { name: 'Pounce', desc: 'Fire damage to the lowest-HP enemy, executes below 20%.', charge: 'Fast', pattern: 'Single target', effects: ['Execute'] },
    tiers: ['A', 'S', 'B', 'C'], sources: ['AP Event', 'Timeless Recruitment'],
    notes: 'AP Visiting items expire.',
  }),
  hero({
    name: 'Basilong', title: 'Dragonkin', element: 'Fire', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Scale Armor', 'Infantry ATK and DEF up.']],
    m3: { name: 'Dragon Breath', desc: 'Fire damage to a cone and burns.', charge: 'Medium', pattern: 'Cone', effects: ['Burn'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Lucky Flip'],
    notes: 'Lucky Coins do not expire — save them across Lucky Flip runs.',
  }),
  hero({
    name: 'Edmund', title: 'Gilded Knight', element: 'Light', rarity: 5, unit: 'Cavalry', role: 'Cavalry bruiser',
    march: [['Gilded Charge', 'Cavalry HP and ATK up.']],
    m3: { name: 'Gleam', desc: 'Light damage to a row and blinds (accuracy down).', charge: 'Medium', pattern: 'Row', effects: ['Blind'] },
    tiers: ['A', 'A', 'B', 'C'], sources: ['Lucky Flip'],
    notes: 'Lucky Flip pool.',
  }),
  hero({
    name: 'Aurora', title: 'Northern Light', element: 'Ice', rarity: 5, unit: 'Archer', role: 'Support',
    march: [['Polar Glow', 'Archer ATK up; ally mana gain up.']],
    m3: { name: 'Aurora Veil', desc: 'Ice damage to random enemies and grants ally mana.', charge: 'Fast', pattern: 'Random x5', effects: ['Mana up'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ['Lucky Flip'],
    notes: 'Lucky Flip pool.',
  }),
  hero({
    name: 'Selantia', title: 'Moon Priestess', element: 'Dark', rarity: 5, unit: 'All-round', role: 'Support',
    march: [['Moonlit Rite', 'All troop ATK up slightly.']],
    m3: { name: 'Eclipse', desc: 'Dark damage to all enemies and lowers their DEF.', charge: 'Slow', pattern: 'All enemies', effects: ['DEF down'] },
    tiers: ['A', 'A', 'A', 'C'], sources: ["Glory's Gift Roulette"],
    notes: "Glory's Gift Roulette pool.",
  }),
  hero({
    name: 'Eric', title: 'Sword Saint', element: 'Nature', rarity: 5, unit: 'Infantry', role: 'Infantry DPS',
    march: [['Blade Dance', 'Infantry ATK up; crit chance up.']],
    m3: { name: 'Thousand Cuts', desc: 'Nature damage to a single target 5 times.', charge: 'Medium', pattern: 'Single x5', effects: ['Multi-hit'] },
    tiers: ['A', 'A', 'S', 'C'], sources: ['Lucky Spin', 'Timeless Recruitment'],
    notes: 'Lucky Spin pool on newer realms.',
  }),
  // ------------------------------ Civil / Economy ------------------------------
  hero({
    name: 'William', title: 'Master Builder', element: 'Nature', rarity: 4, unit: 'Civil', role: 'Construction',
    march: [],
    civil: [{ name: 'Blueprint Efficiency', description: 'Reduces construction resource cost.', requirement: 'Owned, Enhancement +1', stat: 'buildCost', value: 5 }],
    m3: { name: 'Scaffold', desc: 'Small Nature damage to a row.', charge: 'Fast', pattern: 'Row', effects: [] },
    tiers: ['C', 'C', 'C', 'S'], sources: ['Starter / Campaign'],
    notes: 'Own-only construction cost reduction. Enhance before big Citadel pushes.',
  }),
  hero({
    name: 'Chloe', title: 'Quartermaster', element: 'Light', rarity: 4, unit: 'Civil', role: 'Construction',
    march: [],
    civil: [{ name: 'Tight Ledger', description: 'Reduces construction resource cost.', requirement: 'Owned, Enhancement +1', stat: 'buildCost', value: 5 }],
    m3: { name: 'Ration Drop', desc: 'Heals one ally.', charge: 'Fast', pattern: 'Single ally', effects: ['Heal'] },
    tiers: ['C', 'C', 'C', 'S'], sources: ['Hero Recruitment'],
    notes: 'Stacks with William — both cost reductions are additive.',
  }),
  hero({
    name: 'Elsa', title: 'Frost Architect', element: 'Ice', rarity: 4, unit: 'Civil', role: 'Construction speed',
    march: [],
    civil: [{ name: 'Ice Scaffold', description: 'Increases construction speed.', requirement: 'Owned, Enhancement +1', stat: 'buildSpeed', value: 6 }],
    m3: { name: 'Frost Pillar', desc: 'Ice damage to a column.', charge: 'Medium', pattern: 'Column', effects: [] },
    tiers: ['C', 'C', 'C', 'A'], sources: ['Hero Recruitment'],
    notes: 'Own-only build speed — counts toward the Citadel net-time calculator.',
  }),
  hero({
    name: 'Gina', title: 'Harvest Keeper', element: 'Nature', rarity: 4, unit: 'Civil', role: 'Gathering',
    march: [['Forager', 'Gathering speed up when leading a gather march.']],
    civil: [{ name: 'Bountiful Fields', description: 'Increases resource building output.', requirement: 'Owned, Enhancement +1', stat: 'resourceOutput', value: 5 }],
    m3: { name: 'Seed Burst', desc: 'Small Nature damage to random enemies.', charge: 'Fast', pattern: 'Random x3', effects: [] },
    tiers: ['C', 'C', 'C', 'A'], sources: ['Hero Recruitment'],
    notes: 'Send her on Gather Resources days for the march bonus.',
  }),
];
