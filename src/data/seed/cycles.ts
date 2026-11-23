import type { BagItem, CycleEventDays, EventCurrency, PhaseReward, RealmAgeCard, RoyalArmsRaceSlot } from '@/types/game';

export const cycleDays: CycleEventDays[] = [
  {
    eventId: 'ace-lord',
    days: [
      { day: 1, weekday: 'Mon', theme: 'Heroes Assemble (Hero Upgrade)', scoring: ['Recruit items: Timeless Scroll 20,000 · Deluxe Recruit Ticket 10,000', 'Hero shards: 5★ Omni 30,000 · 4★ Omni 10,000 · 3★ Omni 3,000 · 2★ Hero Shard 750', 'Bond Gifts: T1 75 · T2 375 · T3 750 · T4 9,375 · T5 18,750', 'Mythic Hero Choice Cards, Realm Cards and Hero Plaza exchanges give 0'] },
      { day: 2, weekday: 'Tue', theme: 'Path to Development (Build & Research)', scoring: ['Construction power', 'Research power', 'Build/Research speedups'] },
      { day: 3, weekday: 'Wed', theme: 'Daily Activity (Stamina/AP & Gathering)', scoring: ['Stamina spent', 'AP spent', 'Resources gathered'] },
      { day: 4, weekday: 'Thu', theme: 'Training Master (Training Speedup)', scoring: ['Training speedups', 'Troops trained'] },
      { day: 5, weekday: 'Fri', theme: 'Draconic Stone (Draconic Stone & Refinement Crest)', scoring: ['Draconic Stone EXP', 'Refinement Crests'] },
      { day: 6, weekday: 'Sat', theme: 'Supreme Power (Obtain Essences)', scoring: ['Gear/Rune/Totem/Holystone Essences', 'Spinels', 'Crystals'] },
      { day: 7, weekday: 'Sun', theme: 'Path of Eternity (Build / Research / Training Speedup)', scoring: ['All speedups'] },
    ],
  },
  {
    eventId: 'alliance-duel',
    days: [
      { day: 1, weekday: 'Mon', theme: 'Rune & Holystone', scoring: ['Obtain rune/holystone essences, spinels, crystals, scrolls'] },
      { day: 2, weekday: 'Tue', theme: 'Dragon & Totem', scoring: ['Dragon EXP', 'Totem materials'] },
      { day: 3, weekday: 'Wed', theme: 'Draconic & Glory', scoring: ['Draconic Stone EXP', 'Marks of Glory'] },
      { day: 4, weekday: 'Thu', theme: 'Hero Growth', scoring: ['Hero EXP', 'Omni Shards', 'Bond Gifts'] },
      { day: 5, weekday: 'Fri', theme: 'Dragon Crystal & Curio', scoring: ['Dragon Crystals', 'Curio Spinels / Crystals'] },
      { day: 6, weekday: 'Sat', theme: 'Duel Moment', scoring: ['Kill enemy troops'] },
      { day: 7, weekday: 'Sun', theme: 'Duel Moment', scoring: ['Kill enemy troops'] },
    ],
  },
  {
    eventId: 'arms-race',
    days: [
      { day: 1, weekday: 'Mon', theme: 'Hero Upgrade', scoring: ['Omni Shards', 'Hero EXP', 'Scrolls'] },
      { day: 2, weekday: 'Tue', theme: 'Development + Rune & Holystone', scoring: ['Construction/Research power', 'Rune & Holystone materials'] },
      { day: 3, weekday: 'Wed', theme: 'Enhance Gear', scoring: ['Gear Essence spent', 'Forbidden Treasures overlap'] },
      { day: 4, weekday: 'Thu', theme: 'Dragon Points & Totem', scoring: ['Dragon EXP', 'Totem materials'] },
      { day: 5, weekday: 'Fri', theme: 'Draconic Stone & Glory', scoring: ['Draconic Stone EXP', 'Marks of Glory'] },
      { day: 6, weekday: 'Sat', theme: 'Consume Diamond', scoring: ['Diamonds spent'] },
      { day: 7, weekday: 'Sun', theme: 'Consume Diamond', scoring: ['Diamonds spent'] },
    ],
  },
];

/** Wiki (Royal Arms Race page): Thu–Sun, three slots per day; each slot draws a random theme from its set. */
export const royalArmsRace: RoyalArmsRaceSlot[] = [
  { slot: 1, utc: '00:00–07:55', themes: ['Curio', 'Gear & Totem', 'Hero Upgrade', 'Rune & Holystone', 'Train, Build & Research Speedup'] },
  { slot: 2, utc: '08:00–15:55', themes: ['Curio', 'Draconic Stone', 'Obtain Treasure', 'Research', 'Stamina/AP', 'Troop Training Power'] },
  { slot: 3, utc: '16:00–23:55', themes: ['Build & Build Speedup', 'Building, Research & Training Power', 'Curio', 'Diamond Consumption', 'Military & Civil Dragon Pts'] },
];

/**
 * Ace Lord Day 1 (Heroes Assemble) phases — confirmed from in-game screenshots (2026-11-23).
 * Wiki: Days 2–4 share the 600,000 top phase; Day 6 tops out at 800,000 and Day 7 runs 30,000 to 1,200,000.
 */
export const aceLordPhases: PhaseReward[] = [
  { phase: 1, points: 15000, reward: '3x 60m Speedup, 8x 60m Healing Speedup, 150,000 Food, 150,000 Wood' },
  { phase: 2, points: 30000, reward: '3x 60m Speedup, 8x 60m Training Speedup, 150,000 Food, 150,000 Wood' },
  { phase: 3, points: 60000, reward: '3x 60m Speedup, 8x 60m Research Speedup, 150,000 Food, 150,000 Wood' },
  { phase: 4, points: 120000, reward: '3x 60m Speedup, 8x 60m Building Speedup, 150,000 Food, 150,000 Wood' },
  { phase: 5, points: 300000, reward: '400-Diamond chest, 3x 60m Speedup, 1x 30% boost, 150,000 Food, 150,000 Wood' },
  { phase: 6, points: 600000, reward: '2x Hero Choice Card, 3x 60m Speedup, 1x 30% boost, 30,000 Stone, 10,000 Iron' },
];

export const armsRacePhases: PhaseReward[] = [
  { phase: 1, points: 25000, reward: 'Speedup chest' },
  { phase: 2, points: 70000, reward: 'Hero EXP chest' },
  { phase: 3, points: 140000, reward: 'Deluxe Recruit Ticket' },
  { phase: 4, points: 240000, reward: 'Essence chest' },
  { phase: 5, points: 360000, reward: 'Omni Shard chest' },
  { phase: 6, points: 500000, reward: 'Ace Hero Choice Card I/II/III' },
];

export const radiantCards: RealmAgeCard[] = [
  { card: 'Radiant Hero Choice Card I', minWeeks: 0, heroes: ['Boyd'] },
  { card: 'Radiant Hero Choice Card II', minWeeks: 4, heroes: ['Boyd', 'Monica', 'Kaios'] },
  { card: 'Radiant Hero Choice Card III', minWeeks: 22, heroes: ['Boyd', 'Monica', 'Kaios', 'Aerposia'] },
];

export const aceCards: RealmAgeCard[] = [
  { card: 'Ace Hero Choice Card I', minWeeks: 0, heroes: ['Apan'] },
  { card: 'Ace Hero Choice Card II', minWeeks: 4, heroes: ['Apan', 'Norris', 'Patty'] },
  { card: 'Ace Hero Choice Card III', minWeeks: 22, heroes: ['Apan', 'Norris', 'Patty', 'Angelita'] },
];

const b = (id: string, label: string, group: BagItem['group'], unit: string, points: BagItem['points'], verifiedDays?: BagItem['verifiedDays']): BagItem =>
  ({ id, label, group, unit, points, confidence: 'estimate', verifiedDays });

/**
 * Bag Hoard point values per day. Keys: AL = Ace Lord, AR = Arms Race, AD = Alliance Duel.
 * Values are modelled from community spreadsheets and must be refreshed via the OTA data pack.
 */
export const bagItems: BagItem[] = [
  b('omni5', '5-Star Omni Hero Shard', 'Shards', 'shard', { AL1: 30000, AR1: 10000, AD4: 8000 }, ['AL1']),
  b('omni4', '4-Star Omni Hero Shard', 'Shards', 'shard', { AL1: 10000, AR1: 3000, AD4: 2400 }, ['AL1']),
  b('omni3', '3-Star Omni Hero Shard', 'Shards', 'shard', { AL1: 3000, AR1: 600, AD4: 480 }, ['AL1']),
  b('omni2', '2-Star Hero Shard', 'Shards', 'shard', { AL1: 750, AR1: 100, AD4: 80 }, ['AL1']),
  b('timeless', 'Timeless Heroes Recruitment Scroll', 'Scrolls', 'scroll', { AL1: 20000, AR1: 1500 }, ['AL1']),
  b('deluxe', 'Deluxe Recruit Ticket', 'Scrolls', 'ticket', { AL1: 10000, AR1: 500 }, ['AL1']),
  b('bond1', 'T1 Bond Gift', 'Bond', 'gift', { AL1: 75, AR1: 10, AD4: 10 }, ['AL1']),
  b('bond2', 'T2 Bond Gift', 'Bond', 'gift', { AL1: 375, AR1: 50, AD4: 50 }, ['AL1']),
  b('bond3', 'T3 Bond Gift', 'Bond', 'gift', { AL1: 750, AR1: 200, AD4: 200 }, ['AL1']),
  b('bond4', 'T4 Bond Gift', 'Bond', 'gift', { AL1: 9375, AR1: 1000, AD4: 1000 }, ['AL1']),
  b('bond5', 'T5 Bond Gift', 'Bond', 'gift', { AL1: 18750, AR1: 5000, AD4: 5000 }, ['AL1']),
  b('stamina', 'Stamina (per point)', 'AP & Stamina', 'stamina', { AL3: 30 }),
  b('ap', 'Action Points (per point)', 'AP & Stamina', 'AP', { AL3: 40 }),
  b('speedBuild', 'Build Speedup', 'Speedups', 'minute', { AL2: 30, AL7: 30, AR2: 25 }),
  b('speedResearch', 'Research Speedup', 'Speedups', 'minute', { AL2: 30, AL7: 30, AR2: 25 }),
  b('speedTrain', 'Training Speedup', 'Speedups', 'minute', { AL4: 30, AL7: 30 }),
  b('speedUniversal', 'Universal Speedup', 'Speedups', 'minute', { AL2: 30, AL4: 30, AL7: 30, AR2: 25 }),
  b('draconicExp', 'Draconic Stone EXP', 'Dragon', '100 EXP', { AL5: 20, AR5: 20, AD3: 20 }),
  b('refineCrest', 'Refinement Crest', 'Dragon', 'crest', { AL5: 2000 }),
  b('dragonExp', 'Dragon EXP', 'Dragon', '100 EXP', { AR4: 15, AD2: 15 }),
  b('curioSpinel', 'Curio Spinel', 'Curio', 'spinel', { AD5: 1500 }),
  b('curioCrystal', 'Curio Crystal', 'Curio', 'crystal', { AD5: 6000 }),
  b('gearEssence', 'Gear Essence', 'Essences', 'essence', { AL6: 20, AR3: 20 }),
  b('gearSpinel', 'Gear Energy Spinel', 'Essences', 'spinel', { AL6: 1000 }),
  b('gearCrystal', 'Gear Energy Crystal', 'Essences', 'crystal', { AL6: 5000 }),
  b('runeEssence', 'Rune Essence', 'Essences', 'essence', { AL6: 20, AR2: 20, AD1: 20 }),
  b('runeSpinel', 'Rune Spinel', 'Essences', 'spinel', { AL6: 1000, AR2: 1000, AD1: 1000 }),
  b('runeCrystal', 'Rune Crystal', 'Essences', 'crystal', { AL6: 5000, AR2: 5000, AD1: 5000 }),
  b('totemEssence', 'Totem Essence', 'Essences', 'essence', { AL6: 20, AR4: 20, AD2: 20 }),
  b('holyEssence', 'Holystone Essence', 'Essences', 'essence', { AL6: 25, AR2: 25, AD1: 25 }),
  b('arcaneCore', 'Arcane Core (Runic/Totemic)', 'Essences', 'core', { AL6: 20000, AR2: 20000, AD1: 20000 }),
];

export const bagDayLabels: Record<string, string> = {
  AL1: 'Ace Lord D1 · Hero Upgrade', AL2: 'Ace Lord D2 · Build & Research', AL3: 'Ace Lord D3 · Stamina/AP', AL4: 'Ace Lord D4 · Training',
  AL5: 'Ace Lord D5 · Draconic & Crest', AL6: 'Ace Lord D6 · Essences', AL7: 'Ace Lord D7 · All Speedups',
  AR1: 'Arms Race D1 · Hero Upgrade', AR2: 'Arms Race D2 · Dev + Rune', AR3: 'Arms Race D3 · Gear', AR4: 'Arms Race D4 · Dragon & Totem',
  AR5: 'Arms Race D5 · Draconic & Glory', AR6: 'Arms Race D6–7 · Diamonds',
  AD1: 'Duel D1 · Rune & Holystone', AD2: 'Duel D2 · Dragon & Totem', AD3: 'Duel D3 · Draconic & Glory', AD4: 'Duel D4 · Hero Growth',
  AD5: 'Duel D5 · Crystal & Curio', AD6: 'Duel D6–7 · Duel Moment',
};

export const eventCurrencies: EventCurrency[] = [
  { id: 'lucky-coins', name: 'Lucky Coins', eventId: 'lucky-flip', expires: false, guidance: 'Save across runs — 50 Lucky Coins guarantee the Grand Prize.' },
  { id: 'lucky-star-coins', name: 'Lucky Star Coins', eventId: 'glorys-gift-roulette', expires: false, guidance: 'Bank for the next roulette rotation.' },
  { id: 'ice-picks', name: 'Ice Picks', eventId: 'tundra-ruins', expires: false, guidance: 'Carry over to the next Tundra Ruins weekend.' },
  { id: 'astrology-scrolls', name: 'Astrology Summon Scrolls', eventId: 'astrology', expires: false, salvage: 'Sub-items salvage into Summon Scrolls', guidance: 'Save for Anastasia / Maxim banners.' },
  { id: 'trial-tickets', name: 'Trial Recruit Tickets', eventId: 'recruit-trial-monthly-trial', expires: false, guidance: 'Hoard for the month featuring Guan Yu.' },
  { id: 'timeless-scrolls', name: 'Timeless Scrolls', eventId: 'timeless-heroes-limited-recruitment', expires: false, guidance: 'Use on Ace Lord / Arms Race Day 1 for double value.' },
  { id: 'arcane-tools', name: 'Arcane Puzzle tools (Refresh / Remove / Return)', eventId: 'arcane-puzzle', expires: false, guidance: 'Keep until a high-value board appears.' },
  { id: 'pyramid-amulet', name: 'Ancient Amulet', eventId: 'pyramid-event', expires: false, guidance: 'Carry over to the next Pyramid run.' },
  { id: 'pyramid-candle', name: 'Frost Candlestick', eventId: 'pyramid-event', expires: false, guidance: 'Carry over to the next Pyramid run.' },
  { id: 'pyramid-lantern', name: 'Lava Lantern', eventId: 'pyramid-event', expires: false, guidance: 'Carry over to the next Pyramid run.' },
  { id: 'stamina-hourglass', name: 'Stamina Summon Hourglass / Shadow Hourglass', eventId: 'stamina-summon-event', expires: false, guidance: 'Save for a banner you want.' },
  { id: 'ashen-scrolls', name: 'Ashen Lands Scrolls', eventId: 'ashen-lands-limited-recruitment', expires: false, salvage: 'Salvage into Timeless Heroes Recruitment Scrolls', guidance: 'Unused scrolls are not lost — they convert.' },
  { id: 'divination-crystals', name: 'Divination Crystals', eventId: 'feast-of-destiny', expires: true, guidance: 'SPEND before Feast of Destiny / Wonder House ends.' },
  { id: 'ap-visiting', name: 'AP Visiting items', eventId: 'ap-event-visiting-bosses', expires: true, guidance: 'SPEND before the AP event ends.' },
  { id: 'stamina-drops', name: 'Stamina Event drops', eventId: 'stamina-event', expires: true, guidance: 'SPEND before the Stamina event ends.' },
];
