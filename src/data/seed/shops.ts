import type { Shop, ShopItem, Verdict } from '@/types/game';

const i = (name: string, price: string, f2p: Verdict, spender: Verdict, reason: string): ShopItem => ({ name, price, f2p, spender, reason });
const M: Verdict = 'Must Buy';
const S: Verdict = 'Situational';
const T: Verdict = 'Trap / Skip';

export const shops: Shop[] = [
  {
    id: 'alliance', name: 'Alliance Shop', currency: 'Alliance Coins', refresh: 'Weekly',
    items: [
      i('Arcane Barrier (8h)', '3,000', M, M, 'Cheapest shield source; keep two for SvS.'),
      i('Teleport (Advanced)', '6,000', M, S, 'Needed for Realm Expedition / Fort Contest moves.'),
      i('Gear Essence chest', '2,500', M, M, 'Converts directly to Lord power.'),
      i('1h Universal Speedup', '1,500', S, S, 'Fine value once essential items are bought.'),
      i('Resource packs', '800', T, T, 'Farm castles and gathering cover this.'),
    ],
  },
  {
    id: 'royal', name: 'Royal Shop', currency: 'Royal Arena Medals', refresh: 'Weekly',
    items: [
      i('5-Star Omni Shard', '2,400', M, M, 'Best medal-to-power ratio; also scores on Hero Upgrade days.'),
      i('Deluxe Recruit Ticket', '900', S, S, 'Only if shards are sold out.'),
      i('Stamina potion', '300', T, S, 'Low value outside Strike Out weekends.'),
    ],
  },
  {
    id: 'apex', name: 'Apex Shop', currency: 'Apex Arena Coins', refresh: 'Season',
    items: [
      i('Apex hero shard selector', '5,000', M, M, 'Unique source of high-tier shards.'),
      i('Curio Spinel', '1,200', M, M, 'Curios gate exclusive passives.'),
      i('Avatar frame', '3,000', T, T, 'Cosmetic only.'),
    ],
  },
  {
    id: 'trial-turret', name: 'Trial Turret Shop', currency: 'Trial Coins', refresh: 'Weekly',
    items: [
      i('Rune Essence', '400', M, M, 'Runes are the slowest stat track — buy every week.'),
      i('Holystone Essence', '600', S, M, 'Buy once Weapon Forge Lv. 25 is reached.'),
      i('Lord EXP', '200', T, T, 'Leveling outpaces this naturally.'),
    ],
  },
  {
    id: 'sapphire', name: 'Sapphire Shop', currency: 'Sapphires', refresh: 'Monthly',
    items: [
      i('Timeless Scroll', '1,000', M, M, 'Does not expire; doubles as event points.'),
      i('Refinement Crest', '800', S, M, 'Score on Ace Lord Day 5.'),
      i('Name change card', '500', T, T, 'Rarely needed.'),
    ],
  },
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
  {
    id: 'oblivion', name: 'Oblivion War Shop', currency: 'Oblivion Medals', refresh: 'Weekly',
    items: [
      i('Echo shards', '1,500', M, M, 'Only steady Echo source outside divination events.'),
      i('Khaos shards', '4,000', S, M, 'Long grind; commit only if you main Cavalry.'),
      i('Teleport', '2,000', S, S, 'Cheaper elsewhere.'),
    ],
  },
  {
    id: 'dragon', name: 'Dragon Shop', currency: 'Dragon Coins', refresh: 'Weekly',
    items: [
      i('Draconic Stone EXP', '500', M, M, 'Scores Ace Lord Day 5 and Arms Race Day 5.'),
      i('Holy Water (large)', '1,200', M, M, 'Dragon level gates Draconic Stones.'),
      i('Dragon skin', '5,000', T, S, 'Cosmetic.'),
    ],
  },
  {
    id: 'commander', name: 'Commander Shop', currency: 'Commander Medals', refresh: 'Weekly',
    items: [
      i('Talent reset', '1,500', S, S, 'Only if switching Economic to Military.'),
      i('March queue (temp)', '3,000', M, S, 'Big boost for F2P gathering.'),
      i('Commander EXP', '400', T, T, 'Low value.'),
    ],
  },
  {
    id: 'appearance', name: 'Appearance Redeem Shop', currency: 'Appearance Tokens', refresh: 'Season',
    items: [
      i('Castle skin with stats', '3,000', M, M, 'Permanent stat bonus.'),
      i('Name plate', '1,000', T, T, 'Cosmetic only.'),
      i('March effect', '2,000', S, S, 'Small stat bonus on some effects.'),
    ],
  },
];
