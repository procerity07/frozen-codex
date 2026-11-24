/* Strict domain schemas for every Frozen Codex game entity. */

export type Element = 'Fire' | 'Ice' | 'Nature' | 'Light' | 'Dark';
export type Rarity = 2 | 3 | 4 | 5 | 6;
export type UnitType = 'Infantry' | 'Cavalry' | 'Archer' | 'All-round' | 'Civil';
export type TroopFocus = 'Infantry' | 'Cavalry' | 'Archer' | 'All';
export type TroopType = 'Infantry' | 'Cavalry' | 'Archer';
export type ChargeSpeed = 'Very Fast' | 'Fast' | 'Medium' | 'Slow';

/**
 * How confident the bundled data is. "verified" rows match in-game text,
 * "community" rows come from player guides, "estimate" rows are modelled
 * values that the OTA data pack is expected to correct.
 */
export type Confidence = 'verified' | 'community' | 'estimate';

export type AcquisitionSource =
  | 'Hero Plaza'
  | 'Astrology'
  | "Glory's Gift Roulette"
  | 'Lucky Flip'
  | 'Lucky Spin'
  | 'Ace Lord Radiant Card'
  | 'Arms Race Ace Card'
  | 'Recruit Trial'
  | 'Oblivion War Shop'
  | 'Timeless Recruitment'
  | 'Ashen Lands Recruitment'
  | 'Feast of Destiny / Wonder House'
  | 'Alliance Duel'
  | 'Royal Arms Race'
  | 'Strike Out'
  | 'Personal Activity'
  | 'AP Event'
  | 'Stamina Event'
  | 'Pyramid Event'
  | 'Shadow Expedition'
  | 'Battle Pass'
  | 'Starter / Campaign'
  | 'Hero Recruitment'
  | 'Combination Event'
  | 'Battle Pass Event'
  | 'Superb Hero Covenant'
  | 'Epic Hero Covenant'
  | 'Mythic Hero Covenant'
  | 'Mythic Hero Choice Card III'
  | 'Ace Lord'
  | 'First Top-up'
  | 'Royal Shop'
  | 'Arena Reward Chest'
  | 'Monsters'
  | 'Monster Dens'
  | 'Mesdi Portal'
  | 'Trial Turret Shop';

export interface HeroSkill {
  name: string;
  description: string;
}

export interface CivilSkill extends HeroSkill {
  /** Enhancement / star requirement for the passive to be active while merely owned. */
  requirement: string;
  /** Short stat key used by the planner (e.g. "buildSpeed", "troopCap"). */
  stat?: 'buildSpeed' | 'buildCost' | 'researchSpeed' | 'troopCap' | 'trainSpeed' | 'gatherSpeed' | 'healSpeed' | 'resourceOutput';
  value?: number;
  /**
   * Exact values by current stars ("5", "6") and enhancement index (0 = Hero0 … 8 = +8),
   * only where the source lists them; null marks a level the source leaves blank.
   */
  tiers?: Partial<Record<string, (number | null)[]>>;
  unit?: '%' | 'flat' | 'min';
}

export interface Match3Skill extends HeroSkill {
  /** Optional: omitted when no source states the charge speed. */
  charge?: ChargeSpeed;
  pattern: string;
  effects: string[];
}


/** March combat role, classified only from verified march (troop) combat skills — never from match-3 skills. */
export type CombatRole = 'Damage' | 'Support' | 'Healer';
export const COMBAT_ROLES: readonly CombatRole[] = ['Damage', 'Support', 'Healer'];

/** Hero fields that an audit can mark as checked against a source. */
export type HeroAuditField =
  | 'name' | 'title' | 'element' | 'rarity' | 'unitType' | 'combatRole' | 'marchSkills'
  | 'civilSkills' | 'match3Skill' | 'sources' | 'bondGroups' | 'exclusiveCurio' | 'notes';

export interface HeroAudit {
  /** ISO date the hero was last audited. */
  checkedOn: string;
  /** Fields confirmed by at least one cited source. Every other populated field is unverified. */
  verified: HeroAuditField[];
  /** Source URLs supporting the verified fields. */
  sourceUrls: string[];
  /** Conflicts, caveats and corrections made, in plain language. */
  notes: string[];
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  element: Element;
  rarity: Rarity;
  unitType: UnitType;
  role: string;
  marchSkills: HeroSkill[];
  civilSkills: CivilSkill[];
  /** Optional: omitted when no source gives the hero's match-3 skill. */
  match3Skill?: Match3Skill;
  sources: AcquisitionSource[];
  bondGroups: string[];
  exclusiveCurio?: string;
  notes: string;
  confidence: Confidence;
  /** Optional — absent on records created before the combat-role audit. */
  combatRole?: CombatRole;
  /** Optional audit trail; absent on older records. */
  audit?: HeroAudit;
  /**
   * Data revision of this record (absent = 0). An online pack row only replaces a stored row
   * with an equal or higher revision, and bundled rows replace older online rows on re-seed.
   */
  revision?: number;
}

export interface BondGroup {
  id: string;
  name: string;
  members: string[];
  bonuses: { level: number; effect: string }[];
  /** Members listed by the source who are not in this app's hero database. */
  otherMembers?: string[];
  /** false = membership could not be confirmed by any source. */
  verified?: boolean;
  /** false = bonus levels/effects could not be confirmed by any source. */
  bonusesVerified?: boolean;
}

export interface BondLevel {
  level: number;
  title: string;
  expToNext: number;
  bonus: string;
}

export interface BondGift {
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  exp: number;
  /** EXP when the gift goes to a hero of the matching element. */
  sameElementExp?: number;
}

export interface CurioStarCost {
  star: number;
  spinel: number;
  crystal: number;
  unlocks: string;
}

export interface Curio {
  id: string;
  name: string;
  heroId?: string;
  legionPassive: string;
  heroAttribute: string;
  exclusivePassive?: string;
  /** false = name, association and values could not be confirmed by any source. */
  verified?: boolean;
}

/* ------------------------------- Events ------------------------------- */

export type EventCategory =
  | 'Core Cycle'
  | 'Weekly'
  | 'Alliance'
  | 'Cross-Realm War'
  | 'Mini-Game'
  | 'Recruitment & Seasonal';

export type CycleWeek = 'Ace Lord' | 'Arms Race' | 'Both' | 'Random';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface GameEvent {
  id: string;
  name: string;
  category: EventCategory;
  cadence: string;
  cycleWeek: CycleWeek;
  /** Days the event is live (UTC). Empty for random events. */
  days: Weekday[];
  /** Start time as "HH:MM" UTC. */
  startUtc: string;
  durationHours: number;
  /** 4-week rotation slot (1-4) when the event only runs every 4th week. */
  rotationWeek?: 1 | 2 | 3 | 4;
  summary: string;
  rules: string[];
  rewards: string[];
  tips: string[];
  featuredHeroes: string[];
  currencies: string[];
  confidence: Confidence;
  /** Data revision (absent = 0); same precedence rule as Hero.revision. */
  revision?: number;
}

export interface DailyTheme {
  day: number;
  weekday: Weekday;
  theme: string;
  scoring: string[];
}

export interface CycleEventDays {
  eventId: string;
  days: DailyTheme[];
}

export interface RoyalArmsRaceSlot {
  slot: 1 | 2 | 3;
  utc: string;
  /** The slot's theme is drawn at random from this set each day (Thu–Sun). */
  themes: string[];
}

export interface EventCurrency {
  id: string;
  name: string;
  eventId: string;
  expires: boolean;
  salvage?: string;
  guidance: string;
}

export interface PhaseReward {
  phase: number;
  points: number;
  reward: string;
}

export interface RealmAgeCard {
  card: string;
  minWeeks: number;
  heroes: string[];
}

/** Bag Hoard item: point value per event day key. */
export interface BagItem {
  id: string;
  label: string;
  group: 'Shards' | 'Scrolls' | 'Bond' | 'AP & Stamina' | 'Speedups' | 'Dragon' | 'Curio' | 'Essences';
  unit: string;
  points: Partial<Record<BagDayKey, number>>;
  confidence: Confidence;
  /** Day keys whose point value was confirmed from in-game screenshots. */
  verifiedDays?: BagDayKey[];
}

export type BagDayKey =
  | 'AL1' | 'AL2' | 'AL3' | 'AL4' | 'AL5' | 'AL6' | 'AL7'
  | 'AR1' | 'AR2' | 'AR3' | 'AR4' | 'AR5' | 'AR6'
  | 'AD1' | 'AD2' | 'AD3' | 'AD4' | 'AD5' | 'AD6';

export interface SophiaQuestion {
  id: string;
  question: string;
  answer: string;
  category: 'Heroes' | 'Combat' | 'Buildings' | 'Events' | 'Economy' | 'Alliance' | 'General';
  keywords: string[];
}

export interface GiftCode {
  code: string;
  rewards: string;
  addedOn: string;
  status: 'active' | 'expired' | 'unknown';
  userAdded?: boolean;
}

/* --------------------------- Progression --------------------------- */

export interface BuildingRequirement {
  building: string;
  level: number;
}

export interface ResourceCost {
  food: number;
  wood: number;
  stone: number;
  iron: number;
  ancientTome?: number;
  astronomyTome?: number;
  gloryCodex?: number;
  goldStatue?: number;
}

export interface CitadelLevel {
  level: number;
  requires: BuildingRequirement[];
  cost: ResourceCost;
  /** null when the build time is unknown */
  baseSeconds: number | null;
  unlocks: string[];
  confidence: Confidence;
}

export interface BuildingInfo {
  id: string;
  name: string;
  purpose: string;
  maxLevel: number;
  unlockCitadel: number;
  gloryStat?: string;
}

export interface GearSlot {
  slot: 'Weapon' | 'Shield' | 'Chestplate' | 'Helmet' | 'Ring' | 'Shoes';
  attack: TroopType;
  defense: TroopType;
}

export interface GearStage {
  name: string;
  material: string;
  description: string;
}

export interface UpgradeCostRow {
  level: number;
  essence: number;
  spinel?: number;
  crystal?: number;
  arcaneCore?: number;
}

export interface RuneSet {
  name: string;
  focus: TroopFocus;
  stats: string[];
}

export interface TotemSet {
  set: 'I' | 'II' | 'III' | 'IV' | 'V';
  forgeLevel: number;
  bear: string;
  eagle: string;
  wolf: string;
}

export interface HolystoneSet {
  set: 'I' | 'II' | 'III' | 'IV';
  forgeLevel: number;
  unitStat: string;
  troopStat: string;
}

export interface DraconicStone {
  name: string;
  dragonLevel: 30 | 40 | 50;
  effect: string;
  focus: TroopFocus;
}

export interface DragonLairRow {
  level: number;
  militaryReduction: number;
  civilReduction: number;
}

export interface GloryBuilding {
  building: string;
  stat: string;
  focus: TroopFocus;
  /** false = the building/stat pairing was not confirmed by any source. */
  verified?: boolean;
}

/* ------------------------------ Shops ------------------------------ */

export type Verdict = 'Must Buy' | 'Situational' | 'Trap / Skip';

export interface ShopItem {
  name: string;
  price: string;
  f2p: Verdict;
  spender: Verdict;
  reason: string;
  /** Purchase limit per refresh as shown in-game, e.g. "10", "Unlimited", "5 per week". */
  limit?: string;
  /** Unlock requirement shown in-game (e.g. "Citadel Lv. 35"). */
  requires?: string;
}

export interface Shop {
  id: string;
  name: string;
  currency: string;
  refresh: string;
  items: ShopItem[];
  /** Date the prices and limits were checked in-game; absent = not verified. */
  checkedOn?: string;
}

export interface GuideSection {
  heading: string;
  points: string[];
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  sections: GuideSection[];
}

export interface ChecklistTemplateItem {
  id: string;
  label: string;
  detail: string;
  cooldownHours?: number;
  castle: 'all' | 'main';
}

/* --------------------------- OTA manifest --------------------------- */

export interface DataManifest {
  version: number;
  publishedAt: string;
  packs: {
    heroes?: Hero[];
    events?: GameEvent[];
    giftCodes?: GiftCode[];
    sophia?: SophiaQuestion[];
    /** Shop advisor data; replaces the bundled shops when present. */
    shops?: Shop[];
  };
}
