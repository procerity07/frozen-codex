import type { CycleWeek, EventCategory, GameEvent, Weekday, Confidence } from '@/types/game';

type E = Omit<GameEvent, 'id' | 'confidence' | 'startUtc' | 'durationHours' | 'featuredHeroes' | 'currencies' | 'tips' | 'rewards'> & {
  startUtc?: string; durationHours?: number; featuredHeroes?: string[]; currencies?: string[]; tips?: string[]; rewards?: string[]; confidence?: Confidence;
};

const id = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const ev = (e: E): GameEvent => ({
  startUtc: '00:00', durationHours: 24 * Math.max(1, e.days.length), featuredHeroes: [], currencies: [], tips: [], rewards: [], confidence: 'community',
  ...e, id: id(e.name),
});

const WEEK: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const C = (c: EventCategory) => c;
const W = (w: CycleWeek) => w;

const baseEvents: GameEvent[] = [
  // ---------------- A. Core 7-day alternating cycles ----------------
  ev({
    name: 'Ace Lord', category: C('Core Cycle'), cadence: 'Bi-weekly (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: WEEK,
    summary: 'Seven daily themes; personal points unlock 6 reward phases ending in a Radiant Hero Choice Card.',
    rules: ['Runs Monday 00:00 UTC to Sunday 00:00 UTC.', 'Day 1 Heroes Assemble (hero upgrade)', 'Day 2 Path to Development (build & research)', 'Day 3 Daily Activity (stamina/AP & gathering)', 'Day 4 Training Master (training speedup)', 'Day 5 Draconic Stone (draconic stone & refinement crest)', 'Day 6 Supreme Power (obtain essences)', 'Day 7 Path of Eternity (build / research / training speedup)'],
    rewards: ['Each day has 6 phases. Day 1 (confirmed in-game): 15,000 · 30,000 · 60,000 · 120,000 · 300,000 · 600,000 pts; phase 6 gives 2x Hero Choice Card.', 'Days 2–4 also top out at 600,000 (wiki).', 'Day 6 tops out at 800,000; Day 7 runs from 30,000 to 1,200,000.', 'Rank rewards need at least 100,000 personal points.', 'Card pool: Boyd (>0d), Monica (>4w), Kaios, Aerposia (>22w)'],
    tips: ['Hoard shards, scrolls, essences and speedups between cycles and dump on the matching day.', 'Day 7 accepts all speedup types — leftover speedups go here.'],
    featuredHeroes: ['boyd', 'monica', 'kaios', 'aerposia'],
  }),
  ev({
    name: 'Alliance Duel', category: C('Core Cycle'), cadence: 'Bi-weekly (parallel to Ace Lord Week)', cycleWeek: W('Ace Lord'), days: WEEK,
    summary: 'Alliance-vs-alliance daily themes running on different days from Ace Lord in the same week.',
    rules: ['Day 1 Rune & Holystone', 'Day 2 Dragon & Totem', 'Day 3 Draconic & Glory', 'Day 4 Hero Growth', 'Day 5 Dragon Crystal & Curio', 'Day 6–7 Duel Moment (kill troops)', 'Ascending/salvaging runes gives 0 pts on Day 1 — only obtaining essences/spinels/crystals/scrolls scores.'],
    rewards: ['Oskir shards (Gold league rank 1: 15x Oskir Shard, 5x Mythic Hero Covenant)', 'Day 1 phases run from 50,000 to 800,000 points', 'Daily rank rewards by league: Iron, Bronze, Silver, Gold'], featuredHeroes: ['oskir'],
    tips: ['Day 4 Hero Growth overlaps nothing in Ace Lord — use leftover Bond Gifts.', 'Duel Moment: coordinate kills on Sat/Sun with Conquest of Lords.'],
  }),
  ev({
    name: 'Arms Race', category: C('Core Cycle'), cadence: 'Bi-weekly (Arms Race Week)', cycleWeek: W('Arms Race'), days: WEEK,
    summary: 'Daily-themed personal race in the opposite week to Ace Lord. Final phase grants an Ace Hero Choice Card.',
    rules: ['Day 1 Hero Upgrade', 'Day 2 Development + Rune & Holystone', 'Day 3 Enhance Gear + Forbidden Treasures Arms Race', 'Day 4 Dragon Points & Totem', 'Day 5 Draconic Stone & Glory', 'Day 6–7 Consume Diamond'],
    rewards: ['Ace Hero Choice Card I/II/III by realm age', 'Card pool: Apan, Norris, Patty, Angelita (>22w)'],
    featuredHeroes: ['apan', 'norris', 'patty', 'angelita'],
    tips: ['Days 6–7 are diamond spending only — buy what you need in the Diamond Shop now, not earlier.'],
  }),
  ...[
    ['Hero Upgrade (Event)', 'Points for hero EXP, enhancement and star-ups.'],
    ['Development (Event)', 'Points for construction and research power gain.'],
    ['Enhance Gear (Event)', 'Points for Gear Essence spent on enhancement.'],
    ['Rune & Holystone (Event)', 'Points for obtaining rune/holystone essences, spinels and crystals.'],
    ['Dragon Points & Totem (Event)', 'Points for Dragon EXP and Totem materials.'],
    ['Draconic Stone & Glory (Event)', 'Points for Draconic Stone EXP and Marks of Glory.'],
    ['Curio (Event)', 'Points for Curio Spinels and Curio Crystals spent.'],
    ['Consume Diamond (Event)', 'Points per diamond spent.'],
    ['Dragon Crystal', 'Points for Dragon Crystal acquisition and use.'],
    ['Royal Treasure', 'Sub-event chest track tied to cycle participation.'],
  ].map(([name, summary]) => {
    // Wiki Events page: Consume Diamond usually runs Sat–Sun in Arms Race weeks; Curio usually runs Tuesday in Ace Lord weeks.
    const known: Record<string, Pick<GameEvent, 'days' | 'cycleWeek' | 'cadence'>> = {
      'Consume Diamond (Event)': { days: ['Sat', 'Sun'], cycleWeek: 'Arms Race', cadence: 'Usually Sat–Sun in Arms Race weeks' },
      'Curio (Event)': { days: ['Tue'], cycleWeek: 'Ace Lord', cadence: 'Usually Tuesday in Ace Lord weeks' },
    };
    // In-game point tables (screenshots 2026-11-24).
    const extra: Record<string, Partial<E>> = {
      'Curio (Event)': {
        summary: 'Points for obtaining Curio materials and crafting Curios. Phases at 12,000 / 24,000 / 44,000 / 60,000 / 120,000 / 240,000 points.',
        rules: [
          'Obtain a Curio Spinel: +1,000. Obtain a Curio Crystal: +5,000.',
          'Obtain a Curio Essence: 1★ +100, 2★ +500, 3★ +2,000, 4★ +5,000, 5★ +20,000.',
          'Craft a Curio: Common +20,000, Uncommon +50,000, Superb +100,000, Epic +200,000, Legendary +500,000.',
          'Salvaging for Enhance materials gives no points.',
          'Runs for one day (in-game timer); Point Reward, Personal Rank and Realm Rank tabs.',
          'Personal Rank: you need at least 1,000,000 points to qualify; rank rewards scale with how many times the event has run on your realm. Rankings update every hour.',
          'Personal Rank rewards (Curio scroll cards): #1 30, #2 25, #3 20, Top 1% 15, Top 2% 12, Top 5% 10, Top 10% 8, Top 30% 6, Top 50% 4, Top 75% 3, Last 25% 2 (plus 10K Hero EXP potions and 60m speedups).',
        ],
        rewards: ['Curio scroll (1 at phases 1–3, 2 at phase 4)', '3x 60m Speedups (Healing, Training, Research)', '10x 10K Food and Wood', '200 Diamonds (phase 5)', 'Dragon EXP and Dragon Civil Pts (phase 6)', '5,000 Stone and 2,500 Iron (phases 5–6)'],
        tips: ['Crafting one Curio is worth far more than collecting materials; save crafts for this day.', 'A single Common Curio (+20,000) clears phase 1.', 'Rank rewards need 1,000,000 points: two Legendary crafts, or one Legendary plus several Epic.'],
        confidence: 'verified',
      },
    };
    return ev({
      name: name!, category: C('Core Cycle'), cadence: 'Inside Arms Race / Ace Lord cycles', cycleWeek: W('Both'), days: [], summary: summary!,
      rules: ['Runs as a sub-tracker during the matching day of the parent cycle.'], tips: ['Use the Bag Hoard calculator to time your dump with the parent day.'],
      ...known[name!],
      ...extra[name!],
    });
  }),

  // ---------------- B. Weekly & bi-weekly standard ----------------
  ev({
    name: 'Royal Arms Race', category: C('Weekly'), cadence: 'Weekly Thu–Sun, 3 windows per day', cycleWeek: W('Both'), days: ['Thu', 'Fri', 'Sat', 'Sun'],
    summary: 'Three themed windows per day (00:00–07:55, 08:00–15:55, 16:00–23:55 UTC), Thursday to Sunday.',
    rules: ['Each window draws a random theme from a fixed set for that time of day.', '00:00–07:55: Curio, Gear & Totem, Hero Upgrade, Rune & Holystone, Train/Build/Research Speedup.', '08:00–15:55: Curio, Draconic Stone, Obtain Treasure, Research, Stamina/AP, Troop Training Power.', '16:00–23:55: Build & Build Speedup, Building/Research/Training Power, Curio, Diamond Consumption, Military & Civil Dragon Pts.', 'The wiki Royal Arms Race page says Thu–Sun; its Events grid shows Thursday only.'],
    rewards: ['Lylia shards'], featuredHeroes: ['lylia'],
    tips: ['Double-dip: a window that matches the Ace Lord day theme scores in both events.'],
  }),
  ev({ name: 'Ancient Prologue Arms Race', category: C('Weekly'), cadence: 'Bi-weekly Thu (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Thu'], summary: 'Single-day race for Dragon EXP and Dragon Stones.', rules: ['Dragon EXP items and Dragon Stone usage score.'], rewards: ['Dragon EXP', 'Dragon Stones'] }),
  ev({ name: 'Forbidden Treasures Arms Race', category: C('Weekly'), cadence: 'Bi-weekly Wed (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Wed'], summary: 'Gear enhancement race paired with Arms Race Day 3.', rules: ['Gear Essence spent scores; overlaps Arms Race Day 3.'], rewards: ['Gear Essence', 'Gear Energy Spinels'] }),
  ev({ name: 'Army Expansion', category: C('Weekly'), cadence: 'Weekly Thursday', cycleWeek: W('Both'), days: ['Thu'], summary: 'Troop training milestones.', rules: ['Points per troop trained, scaled by tier.'], rewards: ['Dragon EXP', 'Training speedups'], tips: ['Pre-queue a long training batch Wednesday night and finish it Thursday with speedups.'] }),
  ev({
    name: 'Elemental Seal I / II / III', category: C('Weekly'), cadence: 'Weekly Thu–Sat', cycleWeek: W('Both'), days: ['Thu', 'Fri', 'Sat'],
    summary: 'Boss challenge requiring specific elements and minimum star levels.',
    rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'Elemental Seal I runs Thursday and II runs Friday (00:00–24:00 UTC); III follows on Saturday (not visible in that week view).', 'Deploy the required element(s) at or above the stated star level.', 'Boss uses skills from Round 11+ and is immune to stun and silence.', 'Only your highest single run counts for Top 50 rank.', 'Elemental Seal I phase 1 is 125 points.'],
    rewards: ['Diamond chest', '5,000 Dragon EXP', 'Dragon Civil Pts and Dragon Military Pts', '1★ Gear Essence (Seal I) / 1★ Rune Essence (Seal II)', 'Gear Essence'], tips: ['Bring DoT (poison/burn) and multi-hit heroes — crowd control does nothing.'],
  }),
  ev({
    name: 'Lich Attack', category: C('Weekly'), cadence: 'Weekly Sunday', cycleWeek: W('Both'), days: ['Sun'],
    summary: 'Attack the Lich King with 10x march speed and zero soldier losses (Citadel Lv. 6+).',
    rules: ['Citadel Lv. 6+.', 'No troop losses — attack as often as attempts allow.', 'Top 50 damage ranking.'],
    rewards: ['Deluxe / Regal Recruit Tickets', 'EXP Potions', 'Lord EXP'],
  }),
  ev({ name: 'Personal Activity', category: C('Weekly'), cadence: 'Bi-weekly Monday', cycleWeek: W('Both'), days: ['Mon'], summary: 'Personal activity point track.', rules: ['Daily quests and stamina use score.'], rewards: ['Rodriguez shards'], featuredHeroes: ['rodriguez'] }),
  ev({ name: 'Gather Resources', category: C('Weekly'), cadence: 'Bi-weekly Tuesday (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Tue'], summary: 'Gathering race.', rules: ['Resources gathered from the map score.'], rewards: ['Resource chests', 'Speedups'], tips: ['Lead gather marches with Gina.'] }),
  ev({ name: 'Diamond Redeem Shop', category: C('Weekly'), cadence: 'Every 4th weekend (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Sat', 'Sun'], rotationWeek: 4, summary: 'Spend diamonds / vouchers on Curio Scroll Chests and rare materials.', rules: ['Limited stock per item.'], rewards: ['Curio Scroll Chests', 'Rare materials'], currencies: ['Diamonds', 'Redeem Vouchers'] }),

  // ---------------- C. Alliance ----------------
  ev({ name: 'Alliance Showdown', category: C('Alliance'), cadence: 'Every 4th week (Arms Race Week)', cycleWeek: W('Arms Race'), days: WEEK, rotationWeek: 2, summary: 'Shared alliance quest list across Novice, Adept, Master and Legend leagues.', rules: ['20+ members, Citadel Lv. 15+.', 'Quests are shared — claim the ones you can complete.'], rewards: ['League chests'] }),
  ev({
    name: 'Undead Scourge', category: C('Alliance'), cadence: 'Bi-weekly, Tuesday and Thursday (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Tue', 'Thu'], durationHours: 23 + 50 / 60,
    summary: 'The alliance Leader or a Diplomat starts a 20-wave undead defence with 5-minute prep.',
    rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'Open Tuesday and Thursday, 00:00–23:50 UTC.', 'Started by the alliance Leader or a Diplomat; 5-minute prep.', '20 waves; no resources are lost and most wounded units are healed afterwards.', 'Arcane Barrier does NOT block undead attacks.', 'Failing twice stops attacks on your castle — reinforce allies for points.', 'The event ends once every ally has failed twice.', 'Alliance Fortress Boss defence at the end.'],
    rewards: ['Diamonds', 'Speedup 60-min', 'Dragon Civil Pts', '1★ Gear Essence', '1★ Rune Essence', '1★ Totem Essence', 'Alliance Coins'],
  }),
  ev({
    name: 'Oblivion War', category: C('Alliance'), cadence: 'Weekly AvA, from Wednesday', cycleWeek: W('Both'), days: ['Wed', 'Thu', 'Fri'],
    summary: 'AvA map: capture Gate of Demise, Ancient Ruins, Magic Altar, Temple of Life and Camps.',
    rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'Starts Wednesday and runs through at least Friday; the battle time was not shown.', 'Sign-up needs at least 10 members with Citadel Lv. 18+.', 'Occupy a structure for 3 minutes to control it; control earns Time Points.', 'Wounded go to the Battlefield Hospital and return when you leave the battlefield.', 'The alliance with more Time Points wins; both sides get rewards.', 'Oblivion Pyramid spawns the Titan Colossus.'], rewards: ['Oblivion War Shop currency', 'Echo shards via shop'], featuredHeroes: ['echo', 'khaos'],
  }),
  ev({
    name: 'Strike Out', category: C('Alliance'), cadence: 'Every weekend Sat–Sun', cycleWeek: W('Both'), days: ['Sat', 'Sun'],
    summary: 'Whole-alliance milestone track; phase targets run from 600,000 to 15,000,000 points.',
    rules: ['Points come from the whole alliance: consuming stamina, defeating monster dens and event-summoned monsters.', 'Stamina = 600 pts each (not verified).', 'Monster Dens Lv. 1–45 = 4,500–18,000 pts (not verified).', 'Personal ranking: top 100 members. Alliance ranking: top 50 in the local Battle Division.'],
    rewards: ['Edith shards', 'Kujo Mamoru shards', 'Essences', 'Barriers'], featuredHeroes: ['edith', 'kujo-mamoru'],
  }),
  ev({
    name: 'Fort Contest', category: C('Alliance'), cadence: 'Every other Saturday', cycleWeek: W('Both'), days: ['Sat'], durationHours: 2,
    summary: 'Register 1 Fort + 1 Fortress, vote 3 of 5 time slots, then fight a 2-hour battle phase.',
    rules: ['Alliances with 20+ members register; Citadel Lv. 10+ (not verified).', 'Each alliance votes 3 of 5 time slots; the most-chosen slot becomes the battle period.', 'Battle phase lasts 2 hours. Holding a Fort for 30 minutes takes control; otherwise the longest holder wins.', 'Fighting causes wounded soldiers. Members cannot leave the alliance during the contest.', 'Wiki Events page: every other Saturday (app previously: every Saturday). The week parity is not known, so the calendar still shows every Saturday.'], rewards: ['Fort buffs', 'Alliance Coins'],
  }),
  ev({
    name: 'Infernal Gate', category: C('Alliance'), cadence: 'Twice weekly', cycleWeek: W('Both'), days: ['Tue', 'Fri'],
    summary: 'Rally the Infernal Emissary Lv. 1–25 (20k to 120M HP) with your alliance within the time limit.',
    rules: [
      'Rally the Infernal Gate with allies within the time limit; defeating the Infernal Emissary gives every alliance member a kill reward (once per 71 hours).',
      'After the gate closes, damage rewards are given by each Lord\'s damage.',
      'Each Lord has a 71-hour cooldown for taking part.',
      'Lords who take part and then leave the alliance cannot take part again after returning.',
      'Monsters cycle Lich, Arachnid Queen, Leviathan, Dragon, Sandworm King (Lv. 1–5, 6–10 and so on).',
      'Kill rewards (in-game): Lv. 1–9 give 2–6 Recruit Tickets and 1,800–3,050 Alliance Coins (+150 per level); Lv. 10 gives 2 Regal Recruit Tickets and 3,200 coins; Lv. 11–15 give 2–4 Regal tickets and 3,400–4,200 coins (+200 per level); Lv. 16–20 give 4–5 Regal tickets and 4,500–5,700 coins (+300 per level); Lv. 21–25 give 5–7 Regal tickets and 6,000–8,000 coins (+500 per level).',
    ],
    rewards: ['Recruit Tickets (Regal from Lv. 10)', 'Alliance Coins (1,800 at Lv. 1 to 8,000 at Lv. 25)', 'Damage rewards: 5★, 4★ and 1★ Hero Shards, 150K Food, 150K Wood, 30K Stone, Iron'],
    tips: ['Kill the highest level your alliance can clear in time: Lv. 25 gives 7 Regal tickets and over 4x the coins of Lv. 1.', 'Coordinate the 71-hour cooldown so the strongest rally leaders are free on gate days.'],
    confidence: 'verified',
  }),
  ev({ name: 'Resource Supply', category: C('Weekly'), cadence: 'Monday to Sunday (seen in Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], summary: 'Week-long daily event in the Event Center.', rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'How often it returns, its rules and rewards are not recorded yet.'], confidence: 'verified' }),
  ev({ name: 'Holystone Upgrades', category: C('Weekly'), cadence: 'Monday to Sunday (seen in Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], summary: 'Week-long daily event in the Event Center.', rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'How often it returns, its rules and rewards are not recorded yet.'], confidence: 'verified' }),
  ev({ name: 'Alliance Trial', category: C('Alliance'), cadence: 'Weekly Mon–Wed', cycleWeek: W('Both'), days: ['Mon', 'Tue', 'Wed'], summary: 'Cooperative alliance trial stages.', rules: ['Each member contributes attempts.'], rewards: ['Alliance chests'] }),
  ev({ name: 'Alliance Party', category: C('Alliance'), cadence: 'Twice weekly, Tuesday and Friday', cycleWeek: W('Both'), days: ['Tue', 'Fri'], summary: 'Alliance social event, open all day (00:00–24:00 UTC).', rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', 'Runs Tuesday and Friday, 00:00–24:00 UTC.', 'Join the party for points and shared rewards.'], rewards: ['Diamond chest', 'Upgrade item', 'Gold orb', '150K Wood', '150K Food'] }),
  ev({ name: 'Alliance Defense', category: C('Alliance'), cadence: 'Bi-weekly (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Thu'], summary: 'Defend alliance territory against waves.', rules: ['Reinforce weaker members.'], rewards: ['Alliance Coins'] }),
  ev({ name: 'Shadow Expedition', category: C('Alliance'), cadence: 'Every 4th week (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], rotationWeek: 3, summary: 'Four alliance squads fight through 13 Monster strongholds to take the Evil Dragon King Castle of the Shadow Dragon Valazur. Sign-up Sunday to Monday 24:00 UTC.',
    rules: [
      'Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026): sign-up Sunday to Monday 24:00 UTC; the Combat Phase runs to at least Friday.',
      'Registration: alliance Lv. 5 or higher; Lords need Citadel Lv. 20+, pick their competing Hero and join a squad before the event starts.',
      'Map: four squads start at their own bases on a 13-stronghold map. At first a squad can only attack the Monster Den next to its base; dens can only be attacked when connected to a stronghold your squad holds.',
      'The squad that dealt the highest share of damage to a Monster Den occupies it and lights up the routes from it.',
      'Holding all four inner-ring strongholds unlocks the Evil Dragon King Castle. An R4 or higher must start the castle challenge (this starts the siege timer); then every squad member can attack.',
      'Once the castle falls, the remaining monsters flee and the alliance gets all their remaining Alliance points at once. Castle monsters then have infinite HP and give personal points only.',
      'Heroes become fatigued after fighting; Supply Packs (handed out daily at 00:00 UTC) let them keep going. Unused packs are salvaged when the event ends.',
      'All heroes are set to a fixed level; enhancement and Destiny Weapons still count.',
      'Difficulty leagues (monster strength): Novice 100%, Adept 133%, Master 200%, Legend 270%, Ex. 300%. Clear a difficulty twice in a row to go up; fail twice in a row to drop back.',
      'Points are kept if you leave the battlefield, and you can re-enter during the event. Leaving the alliance you signed up with blocks re-entry until you return to it.',
      'Alliance ranking is by total points; ties go to the alliance that took the castle earlier, then to the one that took less time.',
      'Rewards: personal stage rewards, occupation rewards for every member when a Monster Den is taken, and personal and alliance ranking rewards by mail.',
      'Personal rank rewards need at least 1,055,000 personal points; alliance rank rewards need at least 527,500 personal points. Amounts scale with the event size on your server.',
      'Personal rank rewards (in-game): #1 50 hero shards of the featured 5★ hero, 11 chests and 1,000 each of four 1★ essences; #2 40 shards; #3 30 shards; #4–10 20 shards; Top 10% 10; Top 20% 8; Top 30% 7; Top 50% 5 (plus chests and 1★ essences).',
      'Alliance rank rewards (in-game): #1 14 chests, an 800-Diamond chest and 100 each of four 3★ essences; #2 11 chests, 500 Diamonds and 80 each of three; #3–4 45 3★ chests, 400 Diamonds and 50 each; #5–10 28 chests, 300 Diamonds and 30 each of two; #11–50 9 chests, 200 Diamonds and 10 of one.',
      'The battlefield map shows each squad\'s progress on a den as a percentage; "Unlock requirement 0/4" on the castle counts inner-ring strongholds held.',
      'Points (current difficulty, in-game): outer-ring outposts (Forest of Life, Mushroom Jungle, Origin Outpost, Boneyard) give 2,880,000 Alliance and 2,880,000 Personal points each; inner-ring outposts (Gold Plains, Amethyst Pit, Lionheart Fort, Demon Sealing Altar, Ancient Ruins, Dawnlight Harbor, Demonlord Cave, Obsidian Fortress) have stronger enemies and give 3,456,000 Alliance and 3,456,000 Personal points each; the Evil Dragon King Castle has extremely strong enemies and gives 1,088,640 Alliance points and unlimited Personal points.',
    ],
    rewards: ['Ogremire shards', 'Personal points rewards', 'Monster Den occupation rewards', 'Personal and alliance ranking rewards'],
    tips: ['Spread squads so all four inner-ring strongholds fall quickly; the castle tiebreak rewards taking it early.', 'Make sure an R4/R5 is online to start the castle challenge as soon as it unlocks.', 'Use every daily Supply Pack before the event ends; leftovers are salvaged.'],
    featuredHeroes: ['ogremire'], confidence: 'verified' }),
  ev({ name: 'Dragon Arena / Clash', category: C('Alliance'), cadence: 'Periodic', cycleWeek: W('Both'), days: ['Sat'], summary: 'Alliance node deployment and bracket PvP.', rules: ['Deploy dragons to nodes; brackets resolve automatically.'], rewards: ['Dragon EXP', 'Dragon Crystals'] }),

  // ---------------- D. Cross-realm war ----------------
  ev({
    name: 'Conquest of Lords', category: C('Cross-Realm War'), cadence: 'Bi-weekly Saturday (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Sat'], startUtc: '10:00', durationHours: 24,
    summary: 'Cross-realm war for the Hall of Might and 4 Spires.',
    rules: ['8-hour consecutive hold of the Hall of Might auto-wins; otherwise longest occupation.', 'Spire cannons fire every 10 minutes for 1% garrison loss.', 'Enchanted Woodland boundary grants protection.', '30% of structure garrison losses become permanent deaths.', '12,000 personal score target.', 'Trophy Grades and a 9-Realm League.', 'Realm points: 100 per Realm colonized; 25 if never colonized and colonizing no one; 0 if colonized.', 'Ties are broken by Realms colonized, then by which Realm was colonized less.'],
    rewards: ['Trophy Grade chests', 'League rewards'],
  }),
  ev({
    name: 'Realm Expedition', category: C('Cross-Realm War'), cadence: 'Bi-weekly Saturday (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Sat'], startUtc: '10:00', durationHours: 24,
    summary: 'Teleport into enemy realms to pillage and kill.',
    rules: ['Realm Hospital protects wounded.', '8,000 Diamond Mine gathering cap per Lord.', 'Foreign kill points: T1 0 · T2 1 · T3 2 · T4 4 · T5 6 · T6 12 · T7 18 · T8 25 · T9 30 · T10 45 · T11 80 · T12 100.', 'Personal points also come from gathering in a foreign Realm.'],
    rewards: ['Realm ranking chests', 'Diamonds'],
  }),
  ev({
    name: 'Scorching Front', category: C('Cross-Realm War'), cadence: 'Weekly, Saturday to Monday', cycleWeek: W('Both'), days: ['Sat', 'Sun', 'Mon'],
    summary: 'Volcano battle for Fire Crystals; runs Saturday to Monday 24:00 UTC.',
    rules: ['Schedule confirmed from the in-game Event Schedule (week of 23 Nov 2026).', '1 Fire Crystal = 1 point.', '3 free teleports, then scaling diamond cost.', 'Goblin Rocket and Shield map pickups; central supply chests.', 'Realm Hospital fully heals for free after the event.'],
    rewards: ['Ranking chests'],
  }),

  // ---------------- E. Mini-games ----------------
  ev({ name: "Sophia's Test", category: C('Mini-Game'), cadence: '3x weekly (Mon, Thu, Sat)', cycleWeek: W('Both'), days: ['Mon', 'Thu', 'Sat'], summary: '15 trivia questions, 30 seconds each.', rules: ['Rewards depend on accuracy and time used; extra rewards need a set number of correct answers.', 'Quitting mid-test counts the current question as wrong; you can resume from the next one.', 'Alliance help button available.'], rewards: ['Regal Recruit Tickets', 'Deluxe Recruit Tickets', '1★ Gear Essence', '1★ Rune Essence'], tips: ['Use the 30-second lookup tool in this app.'] }),
  ev({ name: 'Lucky Flip', category: C('Mini-Game'), cadence: 'Bi-weekly Wed–Fri (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Wed', 'Thu', 'Fri'], summary: 'Flip cards for prizes; each flip adds +0.02% Lucky Pt.', rules: ['Lucky Coins do NOT expire — saving 50 guarantees the Grand Prize.', 'Unclaimed rewards reset the next day.'], rewards: ['Basilong', 'Edmund', 'Aurora', 'Lucky Grand Prize Chest'], featuredHeroes: ['basilong', 'edmund', 'aurora'], currencies: ['Lucky Coins'] }),
  ev({ name: 'Lucky Spin', category: C('Mini-Game'), cadence: 'Bi-weekly (newer realms)', cycleWeek: W('Both'), days: ['Wed', 'Thu', 'Fri'], summary: 'Roulette for hero shards.', rules: ['Available on newer realms.'], rewards: ['Freya', 'Eric'], featuredHeroes: ['freya', 'eric'] }),
  ev({ name: "Glory's Gift Roulette", category: C('Mini-Game'), cadence: 'Bi-weekly Wed–Fri (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Wed', 'Thu', 'Fri'], summary: 'Roulette with Lucky Star Coins.', rules: ['Lucky Star Coins do NOT expire.', 'Free spins reset every day.'], rewards: ['Kanye', 'Selantia', 'Dimina'], featuredHeroes: ['kanye', 'selantia', 'dimina'], currencies: ['Lucky Star Coins'] }),
  ev({ name: 'Tundra Ruins', category: C('Mini-Game'), cadence: 'Every 4th weekend (Arms Race Week)', cycleWeek: W('Arms Race'), days: ['Sat', 'Sun'], rotationWeek: 2, summary: 'Dig through ruins with Ice Picks.', rules: ['Ice Picks do NOT expire.'], rewards: ['Rare materials'], currencies: ['Ice Picks'] }),
  ev({ name: 'Feast of Destiny', category: C('Mini-Game'), cadence: 'Every 4th week Mon–Wed (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon', 'Tue', 'Wed'], rotationWeek: 1, summary: 'Divination draws; alternates with Wonder House.', rules: ['Divination Crystals EXPIRE.'], rewards: ['Echo', 'Carvell'], featuredHeroes: ['echo', 'carvell'], currencies: ['Divination Crystals'] }),
  ev({ name: 'Wonder House', category: C('Mini-Game'), cadence: 'Every 4th week Mon–Wed (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon', 'Tue', 'Wed'], rotationWeek: 3, summary: 'Pick 9 rewards for your own prize pool, then draw them with Divination Crystals; alternates with Feast of Destiny.',
    rules: [
      'Select 9 rewards from the treasury to make your own prize pool, then spend Divination Crystals to draw from it.',
      'A new round starts once all 9 rewards are claimed. Each draw has a chance to give extra Divination Crystals.',
      'Crystals from daily activity: 1 each at 25, 50, 75, 100, 120 and 140 Daily Activity Pts, and 2 at 160 (8 per day).',
      'Crystals from spending: 1 per 100 Diamonds from pack purchases. Diamond Chests and Monthly Card daily diamonds do not count.',
      'Unused Divination Crystals are cleared when the event ends.',
      'Example pool seen in-game: 5★ Hero Shards (10), 5★ choice chests, 40x 60m Speedups, a 2,000-Diamond chest.',
    ],
    rewards: ['Echo', 'Carvell', '5★ Hero Shards', '5★ chests', '60m Speedups', 'Diamond chest'],
    tips: ['Hit 160 Daily Activity Pts every day of the event for 8 crystals a day.', 'Put the rewards you want most in the pool; you get all 9 eventually, so order only matters if you run out of crystals.', 'Spend every crystal before the event ends; leftovers are deleted.'],
    featuredHeroes: ['echo', 'carvell'], currencies: ['Divination Crystals'], confidence: 'verified' }),
  ev({ name: 'Pyramid Event', category: C('Mini-Game'), cadence: 'Random (paired with AP Event)', cycleWeek: W('Random'), days: [], summary: 'Explore the pyramid with themed tools.', rules: ['Ancient Amulet, Frost Candlestick and Lava Lantern do NOT expire.'], rewards: ['Carvell'], featuredHeroes: ['carvell'], currencies: ['Ancient Amulet', 'Frost Candlestick', 'Lava Lantern'] }),
  ev({ name: 'Arcane Puzzle', category: C('Mini-Game'), cadence: 'Random / bi-weekly Mondays', cycleWeek: W('Ace Lord'), days: ['Mon'], summary: 'Puzzle board alongside Timeless Recruitment.', rules: ['Refresh, Remove and Return tools do NOT expire.'], rewards: ['Timeless Scrolls', 'Materials'], currencies: ['Arcane Puzzle tools'] }),
  ev({ name: "Dwarf's Treasury", category: C('Mini-Game'), cadence: 'Random', cycleWeek: W('Random'), days: [], summary: 'Treasure mini-game.', rules: ['Event-limited tools.'], rewards: ['Materials'] }),
  ev({ name: 'Potion Hut', category: C('Mini-Game'), cadence: 'Random (with Ashen Lands)', cycleWeek: W('Random'), days: [], summary: 'Potion brewing mini-game.', rules: ['Paired with Ashen Lands Limited Recruitment.'], rewards: ['Ashen Lands Scrolls'] }),
  ev({ name: 'Tower of Gemini', category: C('Mini-Game'), cadence: 'Random', cycleWeek: W('Random'), days: [], summary: 'Purchase / progression tower.', rules: ['Climb floors for escalating rewards.'], rewards: ['Hero shards', 'Materials'] }),

  // ---------------- F. Recruitment, AP/Stamina & seasonal ----------------
  ev({ name: 'Astrology', category: C('Recruitment & Seasonal'), cadence: 'Random / periodic', cycleWeek: W('Random'), days: [], summary: 'Primary source for Anastasia, Maxim, Tala, Valerius and Carvell.', rules: ['Summon Scrolls do NOT expire; sub-items salvage into Summon Scrolls.'], rewards: ['Anastasia', 'Maxim', 'Tala', 'Valerius', 'Carvell'], featuredHeroes: ['anastasia', 'maxim', 'tala', 'valerius', 'carvell'], currencies: ['Astrology Summon Scrolls'] }),
  ev({ name: 'Timeless Heroes Limited Recruitment', category: C('Recruitment & Seasonal'), cadence: 'Bi-weekly, ends Monday (Ace Lord Week)', cycleWeek: W('Ace Lord'), days: ['Mon'], summary: 'Wide 5-Star pool.', rules: ['In-game (week of 23 Nov 2026): ends Monday 24:00 UTC; the start day was not shown.', 'Timeless Scrolls do NOT expire.'], rewards: ['Fiona', 'Neptune', 'Kaira', 'Sea Goddess', 'Wu Kong', 'Leona', 'Carvell', 'Edith', 'Tania', 'Freya', 'Eric', 'Eris', 'Rodriguez', 'Kujo Mamoru'], featuredHeroes: ['fiona', 'tania', 'eris', 'wu-kong'], currencies: ['Timeless Scrolls'] }),
  ev({ name: 'Ashen Lands Limited Recruitment', category: C('Recruitment & Seasonal'), cadence: 'Random (with Potion Hut)', cycleWeek: W('Random'), days: [], summary: 'Limited banner.', rules: ['Unused scrolls salvage into Timeless Heroes Recruitment Scrolls.'], rewards: ['Limited heroes'], currencies: ['Ashen Lands Scrolls'] }),
  ev({ name: 'Recruit Trial / Monthly Trial', category: C('Recruitment & Seasonal'), cadence: 'Monthly (Mesdi Portal)', cycleWeek: W('Random'), days: [], summary: 'Monthly recruitment trial.', rules: ['Trial Recruit Tickets do NOT expire.'], rewards: ['Guan Yu', 'Eris', 'Freya', 'Rodriguez', 'Azure Dragon Blade Scroll'], featuredHeroes: ['guan-yu', 'eris'], currencies: ['Trial Recruit Tickets'] }),
  ev({ name: 'AP Event — Visiting Bosses', category: C('Recruitment & Seasonal'), cadence: 'Random', cycleWeek: W('Random'), days: [], summary: 'Ode to Abundance, Visit the Blood\'s Oath, Puss in Boots\' Visit, Visit Swiftclaw.', rules: ['20 AP per attack = 2 visiting items + 1 chest + 0–1 key.', 'Visiting items EXPIRE.'], rewards: ['Kaios', 'Leona', 'Carvell'], featuredHeroes: ['kaios', 'leona', 'carvell'], currencies: ['AP Visiting items'] }),
  ev({ name: 'Stamina Event', category: C('Recruitment & Seasonal'), cadence: 'Random', cycleWeek: W('Random'), days: [], summary: 'Stamina spend drops event items.', rules: ['Visiting drops EXPIRE.'], rewards: ['Neptune', 'Kaira', 'Sea Goddess', 'Wu Kong'], featuredHeroes: ['neptune', 'kaira', 'sea-goddess', 'wu-kong'], currencies: ['Stamina Event drops'] }),
  ev({ name: 'Stamina Summon Event', category: C('Recruitment & Seasonal'), cadence: 'Random', cycleWeek: W('Random'), days: [], summary: 'Summon with stamina-earned scrolls.', rules: ['Summon Scroll / Shadow Hourglass do NOT expire.'], rewards: ['Hero shards'], currencies: ['Stamina Summon Hourglasses'] }),
  ev({ name: 'Seasonal Combination Events', category: C('Recruitment & Seasonal'), cadence: 'Seasonal', cycleWeek: W('Random'), days: [], summary: 'Holiday combination event bundles.', rules: ['Combine seasonal tokens for rewards.'], rewards: ['Seasonal skins', 'Materials'] }),
  ev({ name: 'Battle Pass', category: C('Recruitment & Seasonal'), cadence: 'Monthly season', cycleWeek: W('Both'), days: WEEK, summary: 'Free / Laureate / Legendary Medals tracks.', rules: ['Complete daily and weekly pass quests.'], rewards: ['Medal track rewards'] }),
  ev({ name: 'Top Up Rewards', category: C('Recruitment & Seasonal'), cadence: 'Weekly', cycleWeek: W('Both'), days: WEEK, summary: 'Weekly purchase milestones.', rules: ['Spending thresholds unlock chests.'], rewards: ['Spender chests'] }),
  ev({ name: 'Auction Frenzy', category: C('Recruitment & Seasonal'), cadence: 'Rare', cycleWeek: W('Random'), days: [], summary: 'Realm-wide auction.', rules: ['Highest bids win limited items.'], rewards: ['Rare items'] }),
];

/**
 * Revision of the bundled event data. Bump it whenever bundled event facts are corrected, so the
 * corrections replace older online-pack rows on re-seed. Revision 1 = 2026-11-23 community-wiki check;
 * revision 2 = in-game Ace Lord Day 1 screenshots; revision 3 = in-game Event Schedule (week of 23 Nov 2026).
 */
export const EVENT_DATA_REVISION = 10; // 10 = Shadow Expedition in-game rules; 9 = Wonder House in-game rules; 8 = Infernal Gate in-game rules and kill rewards; 5 = Elemental Seal reward names; 6 = Undead Scourge preview rewards; 7 = Curio point table and Ace Lord Day 2 (in-game)

export const events: GameEvent[] = baseEvents.map((e) => ({ ...e, revision: EVENT_DATA_REVISION }));
