import type { Shop, ShopItem, Verdict } from '@/types/game';

const i = (name: string, price: string, f2p: Verdict, spender: Verdict, reason: string): ShopItem => ({ name, price, f2p, spender, reason });
/** Item with the in-game purchase limit and (optionally) unlock requirement. */
const L = (name: string, price: string, limit: string, f2p: Verdict, spender: Verdict, reason: string, requires?: string): ShopItem =>
  ({ name, price, limit, f2p, spender, reason, ...(requires ? { requires } : {}) });
/** Date the screenshot-verified shops below were checked in-game. */
const CHECKED = '2026-11-23';
const M: Verdict = 'Must Buy';
const S: Verdict = 'Situational';
const T: Verdict = 'Trap / Skip';


/** Shops transcribed from in-game screenshots. Prices and limits are exact; verdicts are suggestions. */
const verifiedShops: Shop[] = [
  {
    id: 'alliance', name: 'Alliance Shop', currency: 'Alliance coins', refresh: 'Alliance Sale weekly; shop stock is shared by the alliance', checkedOn: CHECKED,
    items: [
      L('Weekly curio scroll (Alliance Sale)', '1,500,000 (-50%)', '1 per week', M, M, 'The sale curio changes every week (e.g. Chalice of Blood Scroll). Save coins for the one you need.'),
      L('Regal Recruit Ticket (Alliance Sale)', '30,000 (-50%)', '5 per week', M, M, 'Half price; easy weekly buy.'),
      L('Speedup 30-min (Alliance Sale)', '12,500', '5 per week', S, S, '25,000 per hour. The 3-hr speedup is cheaper per hour.'),
      L('Carriage Pass (Alliance Sale)', '10,000', '10 per week', S, S, 'Buy if you run out.'),
      L('Global Teleport (Alliance Sale)', '500,000', '1 per week', S, S, 'Expensive; only when you need to move kingdoms or regions.'),
      L('Recall Order (Alliance Sale)', '40,000', '5 per week', S, S, 'Useful in fights; keep one or two.'),
      L('Lord Name Changer (Alliance Sale)', '32,000', '2 per week', T, T, 'Cosmetic.'),
      L('Arcane Barrier (8-hr)', '80,000', 'Alliance stock', M, M, 'Shield for SvS and sleep; keep a few spare.'),
      L('Troop ATK +10%', '16,000', 'Alliance stock', S, S, 'Use before a big fight or rally.'),
      L('Troop DEF +10%', '16,000', 'Alliance stock', S, S, 'Use when you expect to be hit.'),
      L('Gather Speed +50%', '40,000', 'Alliance stock', S, S, 'Good for F2P gathering days.'),
      L('Speedup 3-hr', '50,000', 'Alliance stock', S, S, 'Best value per hour here (about 16,700 per hour).'),
      L('Speedup 60-min', '20,000', 'Alliance stock', S, S, '20,000 per hour.'),
      L('Speedup 5-min', '2,400', 'Alliance stock', T, T, 'Worst value per hour (28,800 per hour).'),
      L('Farm Output Up (24-hr)', '9,600', 'Alliance stock', T, S, 'Only if food is short.'),
      L('Lumberyard Output Up (24-hr)', '9,600', 'Alliance stock', T, S, 'Only if wood is short.'),
      L('Quarry Output Up (24-hr)', '14,400', 'Alliance stock', T, S, 'Only if stone is short.'),
      L('Furnace Output Up (24-hr)', '19,200', 'Alliance stock', S, S, 'Iron is the scarcest resource.'),
      L('Well of Life Output Up (24-hr)', '14,400', 'Alliance stock', T, S, 'Only if you are short.'),
    ],
  },
  {
    id: 'royal', name: 'Royal Shop', currency: 'Royal Shop coins', refresh: 'Weekly (some items)', checkedOn: CHECKED,
    items: [
      L('Epic Hero Covenant', '1,500', '2', M, M, 'Rarest item in the shop; only 2 per refresh.'),
      L('Tooka Shard', '1,200', '10', S, M, 'Worth it if you build Tooka; otherwise skip.'),
      L('Riddle Silver Chest', '5,000', '10 per week', S, S, 'Expensive per chest; buy after the cheap essentials.'),
      L('Regal Recruit Ticket', '2,000', 'Unlimited', S, S, 'Good sink for leftover coins.'),
      L('Gerolin Shard', '150', '30', S, S, 'Cheap shards; only useful if Gerolin is in your lineup.'),
      L('1,000-EXP Potion', '25', '80', S, S, 'Cheap hero EXP filler.'),
      L('Arcane Barrier (2h)', '300', '1', S, S, 'Short shield; handy before a quick log-off.'),
      L('Speedup – Building (60m)', '300', '10', T, S, 'Speedups are cheaper in other shops.'),
      L('Speedup – Research (60m)', '300', '10', T, S, 'Speedups are cheaper in other shops.'),
      L('Speedup – Training (60m)', '300', 'Unlimited', T, T, 'Poor value for Royal coins.'),
      L('Speedup – Healing (60m)', '200', 'Unlimited', T, T, 'Poor value for Royal coins.'),
    ],
  },
  {
    id: 'apex', name: 'Apex Shop', currency: 'Apex coins', refresh: 'Weekly (some items)', checkedOn: CHECKED,
    items: [
      L('3★ Troop Rune', '1,000', '6', M, M, 'Direct troop rune upgrade; limited stock.'),
      L('Troop Rune Energy Crystal', '500', '10', M, M, 'Rune levelling material.'),
      L('Rune Energy Crystal', '500', '10', M, M, 'Rune levelling material.'),
      L('100,000 Dragon EXP', '120', '30 per week', S, M, 'Strong value if you level your dragon.'),
      L('10,000 Dragon Civil Pt', '60', '15 per week', S, M, 'Dragon civil growth.'),
      L('10,000 Dragon Military Pt', '60', '15 per week', S, M, 'Dragon military growth.'),
      L('10,000-EXP Potion', '30', '10', S, S, 'Cheap hero EXP.'),
      L('Troop Rune Energy Spinel', '50', 'Unlimited', S, S, 'Leftover-coin sink.'),
      L('Rune Energy Spinel', '50', 'Unlimited', S, S, 'Leftover-coin sink.'),
      L('Troop Rune Essence', '5', 'Unlimited', S, S, 'Leftover-coin sink.'),
    ],
  },
  {
    id: 'commander', name: 'Commander Shop', currency: 'Commander coins', refresh: 'Some items every 14 days', checkedOn: CHECKED,
    items: [
      L('Kujo Mamoru Shard', '5,000', 'Unlimited', S, M, 'Main reason to save these coins if you build Kujo Mamoru.'),
      L('Diamond Chest', '1', '2,000 (14-day refresh)', M, M, 'Almost free diamonds; buy the full limit.'),
      L('Deluxe Recruit Ticket', '2,500', 'Unlimited', S, S, 'Sink for coins once Diamond Chests are done.'),
      L('Random Teleport', '500', '5 (14-day refresh)', S, S, 'Keep one or two in the bag.'),
      L('25K Iron', '500', '10', S, S, 'Iron is the scarcest resource.'),
      L('100K Stones', '500', '10', T, S, 'Gather or farm instead.'),
      L('50K Food', '50', '20', T, T, 'Gather or farm instead.'),
      L('500K Food', '400', '5', T, T, 'Gather or farm instead.'),
      L('50K Wood', '50', '20', T, T, 'Gather or farm instead.'),
      L('500K Wood', '400', '5', T, T, 'Gather or farm instead.'),
    ],
  },
  {
    id: 'sapphire', name: 'Sapphire Shop', currency: 'Sapphires', refresh: 'Weekly (some items)', checkedOn: CHECKED,
    items: [
      L('Apocalypse Codex', 'Not verified', '5 per week', M, M, 'Gated high-level item.', 'Citadel Lv. 40'),
      L('Glory Codex', 'Not verified', '10 per week', M, M, 'Gated high-level item.', 'Citadel Lv. 35'),
      L('Gold Statue', 'Not verified', '200 per week', M, M, 'Gated high-level item.', 'Citadel Lv. 35'),
      L('Astronomy Tome', 'Not verified', 'Unlimited', S, M, 'Gated item.', 'Citadel Lv. 30'),
      L('Totem Energy Stone', '40,000', '100 per week', M, M, 'Main totem levelling material.'),
      L('Totem Energy Crystal', '80,000', '10', S, M, 'Totem levelling material.'),
      L('Totem Energy Spinel', '10,000', '100', S, S, 'Totem levelling material.'),
      L('3★ Bear Totem', '100,000', '1', S, M, 'One-off totem; buy the one your troops use.'),
      L('3★ Eagle Totem', '100,000', '1', S, M, 'One-off totem; buy the one your troops use.'),
      L('3★ Wolf Totem', '100,000', '1', S, M, 'One-off totem; buy the one your troops use.'),
      L('1★ Totem Essence ×50', '40,000', '10', S, S, 'Best price per essence (800 each).'),
      L('1★ Totem Essence ×20', '18,000', '20', S, S, '900 per essence.'),
      L('1★ Totem Essence ×5', '4,800', '50', S, S, '960 per essence.'),
      L('1★ Totem Essence ×1', '1,000', '99', T, T, 'Worst price per essence; buy the bundles first.'),
      L('1★ Dragon Crystal', '8,000', '2', S, S, 'Small stock.'),
      L('Fiona Shard', '350,000', 'Unlimited', T, S, 'Very expensive; only for a Fiona build.'),
      L('20,000 Dragon EXP', '16,000', 'Unlimited', T, S, 'Much cheaper in the Apex and Trial Turret shops.'),
      L('2,000 Dragon Civil Pts', '8,000', 'Unlimited', T, T, 'Much cheaper in the Apex and Trial Turret shops.'),
      L('10K Lord EXP', '20,000', 'Unlimited', T, T, 'Low value.'),
      L('Mark of Glory', '10,000', 'Unlimited', S, S, 'Sink for leftover Sapphires.'),
      L('50K Food', '5,000', 'Unlimited', T, T, 'Gather instead.'),
      L('50K Wood', '5,000', 'Unlimited', T, T, 'Gather instead.'),
      L('10K Stones', '5,000', 'Unlimited', T, T, 'Gather instead.'),
      L('2.5K Iron', '5,000', 'Unlimited', T, T, 'Gather instead.'),
    ],
  },
  {
    id: 'trial-turret', name: 'Trial Turret Shop', currency: 'Trial Turret coins', refresh: 'Weekly (some items)', checkedOn: CHECKED,
    items: [
      L('3★ Strength Rune', '100', '6', M, M, 'Cheap 3★ rune.'),
      L('3★ Accuracy Rune', '100', '6', M, M, 'Cheap 3★ rune.'),
      L('3★ Charge Rune', '100', '6', M, M, 'Cheap 3★ rune.'),
      L('Rune Energy Stone', 'Not verified', '100 per week', M, M, 'Rune levelling material.', 'Trial Turret progress 700'),
      L('Rune Energy Crystal', 'Not verified', '20', M, M, 'Rune levelling material.', 'Trial Turret progress 400'),
      L('Gold Statue', 'Not verified', '200 per week', M, M, 'Gated high-level item.', 'Citadel Lv. 35'),
      L('2,000 Adv. Dragon Military Pts', '25', '5', S, M, 'Advanced dragon points; small stock.'),
      L('20,000 Dragon EXP', '16', '50', S, S, 'Good dragon value.'),
      L('2,000 Dragon Civil Pts', '8', '50', S, S, 'Good dragon value.'),
      L('Gina Shard', '50', '10', S, S, 'Only if you build Gina.'),
      L('1★ Rune Essence ×20', '15', '100', S, S, 'Best price per essence (0.75 each).'),
      L('1★ Rune Essence ×5', '4', '200', S, S, '0.8 per essence.'),
      L('1★ Rune Essence ×1', '1', '499', S, S, 'Fine once the bundles are sold out.'),
      L('Rune Energy Spinel', '10', '200', S, S, 'Rune levelling material.'),
      L('Speedup (60m)', '12', '99', S, S, 'Cheap speedups.'),
      L('10K Lord EXP', '20', '50', T, T, 'Low value.'),
    ],
  },
  {
    id: 'oblivion', name: 'Oblivion War Shop', currency: 'Oblivion War coins', refresh: 'Weekly (some items)', checkedOn: CHECKED,
    items: [
      L('5★ Omni Hero Shard', '1,000', '5 per week', M, M, 'Shards for any 5★ hero.', 'Pro I rank'),
      L('Handy Hurricane Scroll', '10,000', '1', S, M, 'One-off rare item.', 'Legend rank'),
      L('Holy Emblem', '125', '60 per week', M, M, 'Weekly-limited material.'),
      L('Holystone Energy Stone', '50', '100 per week', M, M, 'Holystone levelling material.'),
      L('Holystone Energy Spinel', '50', '100 per week', S, M, 'Holystone levelling material.'),
      L('1★ Holystone Essence', '5', '1,000 per week', S, S, 'Holystone material.'),
      L('Locked Oblivion Chest', '3,850', '5 per week', S, S, 'Expensive; buy after the materials.'),
      L('Echo Shard', '1,000', 'Unlimited', S, M, 'Only if you build Echo.'),
      L('Speedup (24h)', '800', 'Not verified', S, S, 'Best speedup price in this shop.', 'Elite II rank'),
      L('Speedup (8h)', '300', 'Unlimited', S, S, 'Coin sink.'),
      L('Speedup (3h)', '150', 'Unlimited', S, S, 'Coin sink.'),
      L('Mark of Glory', '20', 'Unlimited', S, S, 'Coin sink.'),
      L('Resources Choice Chest', '500', 'Unlimited', T, T, 'Gather instead.'),
      L('Small Resources Chest', '75', 'Unlimited', T, T, 'Gather instead.'),
    ],
  },
  {
    id: 'dragon', name: 'Dragon Shop', currency: 'Dragon coins (shards use a second currency)', refresh: 'Every 2 days (top items)', checkedOn: CHECKED,
    items: [
      L('Draconic Holy Water', '2', '2,000', M, M, 'Very cheap dragon material.'),
      L('Dragon Language Energy Stone', '100', '100', M, M, 'Dragon Language levelling material.'),
      L('Wishing Candle', '750', '20', S, M, 'Expensive; buy after the materials.'),
      L('Epic Draconic Shard (any of 8 types)', '500', 'Unlimited', S, M, 'Buy the types your dragon uses.', 'Dragon City difficulty 7'),
      L('Superb Draconic Shard (any of 8 types)', '100', 'Unlimited', S, S, 'Buy the types your dragon uses.', 'Dragon City difficulty 5'),
      L('Uncommon Draconic Shard (any of 8 types)', '25', 'Unlimited', S, S, 'Early filler; save for Superb/Epic once unlocked.', 'Dragon City difficulty 3'),
    ],
  },
  {
    id: 'melan', name: 'Melan Domain Shop', currency: 'Melan Domain crystals', refresh: 'Weekly', checkedOn: CHECKED,
    items: [
      L('Riddle Silver Chest', '2', '200', M, M, 'Very cheap chests; buy the full limit.'),
      L('Riddle Golden Chest', '40', '10', M, M, 'Cheap golden chests.'),
      L('Scorpio', '200', '1', S, S, 'Collectible; use not verified.'),
      L('Sagittarius', '200', '1', S, S, 'Collectible; use not verified.'),
      L('Capricorn', '200', '1', S, S, 'Collectible; use not verified.'),
      L('Exquisite Card', '300', '1', S, S, 'Collectible; use not verified.'),
      L('Miracle Album', '300', '1', S, S, 'Collectible; use not verified.'),
      L('Rainbow Balloon (5★)', '80', '1', S, S, 'Collectible; use not verified.'),
      L('Cavalry Set (5★)', '80', '1', S, S, 'Collectible; use not verified.'),
      L('Fire Lion King (5★)', '80', '1', S, S, 'Collectible; use not verified.'),
      L('Ballet Shoes (5★)', '80', '1', S, S, 'Collectible; use not verified.'),
      L("Tour's Music Box (5★)", '80', '1', S, S, 'Collectible; use not verified.'),
      L('Ferris Wheel Ticket (5★)', '80', '1', S, S, 'Collectible; use not verified.'),
      L('Cloud Steed (4★)', '40', '1', S, S, 'Collectible; use not verified.'),
      L('Bubble Wand (4★)', '40', '1', S, S, 'Collectible; use not verified.'),
      L('Nutcracker (4★)', '40', '1', S, S, 'Collectible; use not verified.'),
    ],
  },
  {
    id: 'appearance', name: 'Appearance Redeem Shop', currency: 'Appearance coins', refresh: 'One-time purchases', checkedOn: CHECKED,
    items: [
      L('Hero Skin Shard ×2', '1', '2,000', M, M, 'Almost free; buy as needed for hero skins.'),
      L('Adjudicator Skin Shard ×2', '1', '1,000', M, M, 'Almost free; buy as needed.'),
      L('Iron Blood Throne (Permanent, 10★)', '1,000', '1', S, M, 'Highest appearance star level; best if you are saving for stats.'),
      L('Void: Golden Decimation (Permanent, 10★)', '1,000', '1', S, M, 'Highest appearance star level.'),
      L('Extreme Cold (Permanent, 8★)', '600', '1', S, S, 'Mid-tier appearance.'),
      L('Goblin Demolition Squad (Permanent, 8★)', '600', '1', S, S, 'Mid-tier appearance.'),
      L('Sunny Nest (Permanent, 6★)', '300', '1', S, S, 'Mid-tier appearance.'),
      L('Dark Guard (Permanent, 3★)', '200', '1', T, T, 'Low star level for the price.'),
      L('Christmas Reindeer (Permanent, 3★)', '200', '1', T, T, 'Low star level for the price.'),
      L('Gargoyle (frame)', '100', '1', T, T, 'Cosmetic.'),
      L('Elite Nameplate (Permanent, 1★)', '30', '1', T, T, 'Cosmetic.'),
      L('Siren Serenade Chat Background', '50', '1', T, T, 'Cosmetic.'),
      L('Siren Serenade Chat Bubble', '30', '1', T, T, 'Cosmetic.'),
      L('Tania Sticker II', '30', '1', T, T, 'Cosmetic.'),
      L('Tania Sticker III', '30', '1', T, T, 'Cosmetic.'),
      L('Tania Sticker IV', '30', '1', T, T, 'Cosmetic.'),
    ],
  },
];

/** Shops not yet checked in-game. */
const unverifiedShops: Shop[] = [
  {
    id: 'diamond', name: 'Diamond Shop', currency: 'Diamonds', refresh: 'Daily',
    items: [
      i('Daily discounted stamina', '50', M, M, 'Discounted every day; buy on Strike Out weekends first.'),
      i('VIP points', '200', S, S, 'Only to hit a VIP breakpoint (1, 9).'),
      i('Instant resource packs', '400', T, T, 'Worst diamond value in the game.'),
    ],
  },
  {
    id: 'diamond-redeem', name: 'Diamond Redeem Shop', currency: 'Diamonds / Redeem Vouchers', refresh: 'Every 4th weekend',
    items: [
      i('Curio Scroll Chest', '1,500', M, M, 'Rare curio source; buy during Arms Race Day 6–7 for double value.'),
      i('Rune Crystal', '2,000', S, M, 'Strong if runes are your bottleneck.'),
      i('Skin shard', '1,000', T, S, 'Cosmetic plus minor stat.'),
    ],
  },
  {
    id: 'black-market', name: 'Black Market', currency: 'Resources / Diamonds', refresh: 'Every 8 hours',
    items: [
      i('Hero shards (resource price)', 'Food/Wood', M, M, 'Always buy resource-priced shards.'),
      i('Speedups (resource price)', 'Stone/Iron', M, M, 'Converts excess resources to speedups.'),
      i('Diamond-priced items', 'Diamonds', T, S, 'Never worth diamonds for F2P.'),
    ],
  },
];

export const shops: Shop[] = [...verifiedShops, ...unverifiedShops];
