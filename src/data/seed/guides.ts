import type { ChecklistTemplateItem, Guide } from '@/types/game';

export const guides: Guide[] = [
  {
    id: 'new-player', title: 'New Player Progression & VIP Breakpoints', summary: 'The first 8 weeks of a realm, in priority order.',
    sections: [
      { heading: 'First week', points: ['Push Citadel every day; never let the build queue idle.', 'Clear Campaign for hero EXP and the first Mesdi Portal chapters.', 'Redeem every gift code in the Vault on day 1.'] },
      { heading: 'VIP breakpoints', points: ['VIP 1: Quick Queue — worth reaching immediately.', 'VIP 9: Free Talent switch — lets you swap Economic and Military trees without reset items.'] },
      { heading: 'Lord Talents', points: ['Skip the Balanced tree.', 'Run pure Economic while building, switch to pure Military for war weeks.'] },
    ],
  },
  {
    id: 'institute', title: 'Institute Research Priority', summary: 'Economy and queues first, then combat, then Formations.',
    sections: [
      { heading: 'Phase 1 — Economy', points: ['Construction speed', 'Research speed', 'Extra march queues', 'Gathering speed'] },
      { heading: 'Phase 2 — Combat', points: ['Your main troop type ATK/DEF/HP', 'Troop Lethality', 'Healing speed and Medical Tent capacity'] },
      { heading: 'Phase 3 — Formations', points: ['Institute Lv. 28 unlocks Infantry, Cavalry and Archer Formations — research the one matching your Main Troop Focus first.'] },
    ],
  },
  {
    id: 'monster-den', title: 'Monster Den Rally Optimization', summary: 'Maximise Strike Out points per stamina.',
    sections: [
      { heading: 'Rally composition', points: ['Lead with an element that counters the den boss.', 'Bring heroes with DoT for long fights.'] },
      { heading: 'Point math', points: ['Dens Lv. 1–45 award 4,500–18,000 Strike Out points.', 'Raw stamina is worth 600 points — dens are the better use on weekends.'] },
    ],
  },
  {
    id: 'mesdi-turret', title: 'Mesdi Portal & Trial Turret', summary: '24 portal chapters plus the weekly turret climb.',
    sections: [
      { heading: 'Mesdi Portal', points: ['24 chapters; each clears with element-matched teams.', 'Also hosts the Monthly Recruit Trial.'] },
      { heading: 'Trial Turret', points: ['Climb weekly; the Trial Turret Shop sells Rune Essence — buy every week.'] },
    ],
  },
  {
    id: 'sanctuary', title: 'Sanctuary Cycling', summary: 'Never let troops die permanently.',
    sections: [
      { heading: 'Order of protection', points: ['Medical Tent holds wounded first.', 'Overflow goes to the Sanctuary, revived free with Holy Light.', 'The Alliance Hospital takes wounded beyond your Hospital; healing there costs Alliance Kudos Coins.', 'Anything beyond that is permanent death.'] },
      { heading: 'Cycling', points: ['Heal the Medical Tent before every fight so the Sanctuary stays empty.', 'Revive Sanctuary troops daily with free Holy Light.'] },
    ],
  },
  {
    id: 'daily-tricks', title: 'Daily Efficiency Tricks', summary: 'Small habits that save hundreds of materials a month.',
    sections: [
      { heading: '1-Essence Daily Quest Trick', points: ['Daily quests only need one essence used — spend 1 Gear/Rune/Totem essence instead of a full level, then bank the rest for Ace Lord Day 6.'] },
      { heading: 'Cooldowns', points: ['Instant Output has a 12-hour cooldown — use it twice a day.', 'Refresh Greenhouse seeds every time you log in.'] },
    ],
  },
  {
    id: 'troop-focus', title: 'Pick One Troop Type and Stack It', summary: 'Every stat system has an Infantry, Cavalry and Archer version — put everything into one.',
    sections: [
      { heading: 'Why', points: ['Choose Infantry, Cavalry or Archer and build heroes of that type; spreading upgrades over three types makes all of them weak.', 'Set it in Settings (Main troop type) so the app highlights the right heroes.'] },
      { heading: 'What to upgrade for your type', points: ['Gear (the biggest single stat source).', 'Runes: Strength = Infantry, Charge = Cavalry, Accuracy = Archer, Troop Runes = all troops. 6 sets of 4 runes.', 'Totems (Weapon Forge Lv. 16): Bear = Infantry, Wolf = Cavalry, Eagle = Archer.', 'Holystones (Weapon Forge Lv. 25): Strength, Eternal and Life holystones each boost different troop stats when modified.', 'Draconic Stones (unlock at Dragon Lv. 30) and Dragon skills.', 'Glory Levels and Curios (Weapon Forge Lv. 20).'] },
      { heading: 'Formations', points: ['Institute Lv. 28 unlocks Cavalry and Archer Formations (Infantry is the default).', 'A formation puts that troop type at the front. It only matters when you send mixed troops — research the one for your main type.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: FAQ, Runes, Totems, Holystone, Draconic Stone, Formations (checked Nov 2026).'] },
    ],
  },
  {
    id: 'owned-heroes', title: 'Heroes That Help Just by Being Owned', summary: 'Civil and "(Passive)" skills work without marching — and when they unlock.',
    sections: [
      { heading: 'How it works', points: ['Skills marked Civil or "(Passive)" say "Own the hero to activate this effect": they boost your account even if the hero never marches.', 'Skills that say "Takes effect when the hero joins troop battle" only work in that hero\'s march.', 'My Heroes adds up every owned bonus for you.'] },
      { heading: 'Unlock levels (confirmed in-game)', points: ['3★: the skill under the main skill is active on obtaining, then Lv. 31 and Lv. 71.', '4★, 5★ and 6★: active on obtaining, then Lv. 31 and Lv. 131.', 'Hero skills: 2nd at Lv. 11, 3rd at Lv. 31, 4th at Lv. 71; the 5th unlocks at 6★ (5★ heroes) or 7★ (6★ heroes).', 'The main troop skill grows 100% → 120% → 150% → 200% → 300% → 500% of troop ATK from Hero0 to +5, and stops at 500%.'] },
      { heading: 'Strong owned bonuses (checked in-game)', points: ['All troops: Wu Kong, Kaira and Isabella (HP, DEF, ATK); Setemos (DEF); Leona (ATK).', 'By troop type: Kaios (Infantry/Cavalry/Archer HP), Echo (Infantry/Cavalry/Archer ATK).', 'Castle defence: Monica (Castle Battle HP, DEF, ATK when fighting in your castle).', 'Troop capacity: Saya, Sirona, Lylia, Carvell, Patty, Odell, Gina.', 'Building: Saya and Elsa (construction speed), Chloe (construction cost).'] },
      { heading: 'Tip', points: ['Levelling an owned civil hero to Lv. 31 and Lv. 131 unlocks its 2nd and 3rd bonus — often cheaper than enhancing a marching hero.'] },
    ],
  },
  {
    id: 'save-for-events', title: 'What to Save and When to Spend', summary: 'Most items are worth more on the right event day.',
    sections: [
      { heading: 'Weekly timing', points: ['Hero shards, recruits and covenants: Ace Lord Day 1 (Monday, Heroes Assemble).', 'Construction and research: Ace Lord Day 2 (+5 points per 1 power gained).', 'Troop training: Thursday (Army Expansion and Ace Lord Day 4).', 'Curio crafting: the Curio day (Tuesday in Ace Lord weeks). One Common craft is +20,000 points; a Legendary is +500,000.'] },
      { heading: 'Items that keep — save them', points: ['Lucky Flip Coins: wait until you have 50, which guarantees the Grand Prize.', 'Green stamina bottles: for the Stamina Event.', 'Astrology Summon Scrolls: 405 saved scrolls get a March Skin.', 'Arcane Puzzle tools (Refresh, Remove, Return) do not expire.'] },
      { heading: 'Items that expire — use them', points: ['Divination Crystals (Wonder House / Feast of Destiny) are deleted when the event ends.', 'Shadow Expedition Supply Packs are salvaged at the end.', 'Daily Arena rank rewards must be claimed by hand or they expire the next day.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: FAQ, Events. Point values from in-game event screens (Nov 2026).'] },
    ],
  },
  {
    id: 'resources', title: 'Resource Value and Cheap Resources', summary: 'How to compare resources and where they come cheapest.',
    sections: [
      { heading: 'Exchange rate', points: ['1 Iron = 4 Stone = 20 Wood = 20 Food. Use it to judge any resource trade.', 'Iron is the scarcest — prioritise iron when a shop or chest lets you choose.'] },
      { heading: 'Cheap sources', points: ['Black Market: resource-priced speedups are almost always worth buying; lock good offers to keep them through the 3-hour refresh.', 'Wishing Pool: up to 10 free claims a day (more with upgrades); unused claims do not carry over.', 'Instant Output: 12-hour cooldown, claim twice a day.', 'Diamond Shop: small resource packs cost slightly less per unit than big ones, but gathering is free — only buy when stuck.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: FAQ, Wishing Pool. Shop prices checked in-game (Nov 2026).'] },
    ],
  },
  {
    id: 'gear-refine', title: 'Gear Modification and Refinement', summary: 'Lock good rolls before modifying; where Refinement Crests come from.',
    sections: [
      { heading: 'Modification', points: ['Each modification rolls random attributes; every gear piece has one exclusive attribute plus common ones (no duplicate common types).', 'Lock a good attribute BEFORE modifying. A locked slot only changes if the same attribute rolls higher.', 'Each extra lock raises the material cost — lock only what you want to keep.', 'When every open slot reaches rank 5, another slot unlocks (up to 4).'] },
      { heading: 'Refinement Crests', points: ['Used for Gear, Rune, Totem, Draconic Stone and Glory Refinement.', 'Diamond Shop sells them for 100 diamonds each; they also come from Alliance Showdown, Feast of Destiny, Wonder House, Glory\'s Gift Roulette, Lucky Flip, Pyramid Event and Tundra Ruins.', 'Using them on Ace Lord Day 5 also scores event points.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: Gear, Refinement (checked Nov 2026).'] },
    ],
  },
  {
    id: 'glory', title: 'Glory Levels', summary: 'Building upgrades past Lv. 15 that add battle stats.',
    sections: [
      { heading: 'Basics', points: ['Glory Levels unlock on a building once it reaches Lv. 15 and are raised with Marks of Glory.', 'They give large battle bonuses, and Glory Refinement adds more on top.'] },
      { heading: 'Which buildings give troop stats', points: ['Citadel and Vehicle Workshop: Troop ATK, DEF and HP.', 'War Hall: Troop ATK. Wishing Pool: Troop HP. Lookout: Troop DEF.', 'Also available on Wall, Warehouse, Institute, Weapon Forge, Posthouse, Embassy, the three troop camps and more.'] },
      { heading: 'Where Marks of Glory come from', points: ['Sapphire Shop and Oblivion War Shop sell Marks of Glory with no limit — a good sink for leftover currency.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: Glory Level, Troop Attributes. Shop listings checked in-game (Nov 2026).'] },
    ],
  },
  {
    id: 'arena', title: 'Arena Basics', summary: 'Royal Arena, Apex Arena and their rules.',
    sections: [
      { heading: 'Royal Arena', points: ['Unlocks after Chapter 5. Ratings reset every Monday 00:00 UTC.', 'Daily rank rewards are based on the previous day — claim them by hand or they expire the next day.', 'Each week 3 heroes are banned and 3 are boosted (+20% ATK and +20% HP) — check before setting your defence.', 'Arena Tokens buy items in the Royal Shop.'] },
      { heading: 'Apex Arena', points: ['Opens 21 days after the server launches; the top 500 of the Royal Arena Battle Division qualify.', 'Best-of-three matches. Castle buffs do not apply here.', 'Arena Badges buy items in the Apex Shop (troop runes and rune crystals are the best value).'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: Arena (checked Nov 2026).'] },
    ],
  },
  {
    id: 'bosses', title: 'Boss Events: Elemental Seal, Lich Attack, Infernal Gate', summary: 'How each boss works and what to bring.',
    sections: [
      { heading: 'Elemental Seal', points: ['Only heroes of the listed elements and minimum stars can join.', 'You can attack many times; only your highest damage counts for rewards and rank (top 50 get rank rewards).', 'Bosses are immune to stun and silence, and start using skills from round 11 — bring damage over time and raw damage, not control.'] },
      { heading: 'Lich Attack', points: ['Citadel Lv. 6+ can join. Attacking the Lich King loses no troops, and marches move 10x faster.', 'Rewards come from each hit\'s damage, plus rank rewards for the top 50.'] },
      { heading: 'Infernal Gate', points: ['Your alliance rallies the Emissary; each kill gives every member a kill reward (once per 71 hours).', 'Damage rewards jump at 10,001 damage (4★ crystals) and 500,001 damage (red-star crystals).', 'Set your alliance\'s time on the event page so the alarm matches.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: Elemental Seal, Lich Attack. Infernal Gate from in-game screens (Nov 2026).'] },
    ],
  },
  {
    id: 'greenhouse', title: 'Nursery Greenhouse', summary: 'Seeds, helping other lords and crop upgrades.',
    sections: [
      { heading: 'Getting seeds', points: ['Seed tasks refresh at 00:00 UTC (or when you next log in).', 'Refreshing a task can raise its quality — better tasks give better seeds.', 'A higher-level greenhouse gives more tasks and more crop boxes.'] },
      { heading: 'Growing', points: ['One seed per box. Better seeds grow longer and give more, but are more likely to become unstable.', 'Unstable crops need help from other lords; each help raises the final yield.', 'Helping other lords gives you crops too — visit alliance greenhouses daily.'] },
      { heading: 'Sources', points: ['Puzzles & Chaos wiki: Nursery Greenhouse (checked Nov 2026).'] },
    ],
  },
  {
    id: 'dragon', title: 'Dragon Lair & Draconic Stones', summary: 'What the dragon gives you and how to grow it (checked in-game).',
    sections: [
      { heading: 'What the dragon does', points: ["The dragon's level raises the limits of its Civil and Military passive skills.", 'Dragon EXP comes from items, killing monsters on the world map, and Feed.', 'Train gives Civil Points; Gift gives resources.', 'The Lair shows limited attempts (5) with a refill timer under Feed / Train / Gift.'] },
      { heading: 'Military passive skills', points: ['Infantry, Archer, Cavalry and Vehicle ATK; Infantry, Archer, Cavalry and Vehicle HP; Troop DEF, Troop HP and Troop Capacity.', 'Troop ATK unlocks at Dragon Lv. 45 and Troop Dmg Up at Dragon Lv. 60.', 'The wheel shows /30; the Breakthrough in the middle raises the limit (skills reach Lv. 40).'] },
      { heading: 'Dragon skill levels (checked in-game)', points: ['Skills go to Lv. 40 (the wheel shows /30 until the Breakthrough).', 'Upgrade cost per level is the same for every skill (Cavalry ATK 8→9 and Troop HP 8→9 both cost 28k): 2→3 1,022 · 3→4 2,045 · 4→5 3,812 · 5→6 6,881 · 6→7 11k · 7→8 18k · 8→9 28k · 9→10 39k · 10→11 54k · 11→12 77k · 12→13 107k · 13→14 151k · 14→15 212k · 15→16 296k.', 'Each level needs a minimum Dragon level (Troop HP needs Dragon Lv. 40 up to skill Lv. 15, Lv. 41 for 16).', 'Troop HP: +1% per level up to Lv. 16 (16%); at Lv. 40 it is 300% plus Troop Dmg Taken Down 10% (unlocks at skill Lv. 35).', 'Troop Capacity: 14,700 at Lv. 19; 50,000 at Lv. 40 plus Troop Dmg Up 10% (unlocks at skill Lv. 35).', 'Cavalry ATK: 10% at Lv. 8, 11% at Lv. 9.', 'Each skill also has a Skill Bonus that needs 1★ (Ascend).', 'Ascend cost (wiki): 1★ = 10× 1★ Dragon Crystal · 2★ = 10× 2★ · 3★ = 10× 3★ · 4★ = 10× 4★ (worth 10 / 80 / 640 / 5,120 1★ crystals).'] },
      { heading: 'Civil passive skills', points: ['Gather Food, Wood, Stone, Iron and Gather Resource; Troop Load; Construction, Research and Training Speed; March Speed.', 'Rescue Units unlocks at Dragon Lv. 44 and Troop Dmg Taken Down at Dragon Lv. 55.', 'See your totals under Attributes (Military and Civil tabs).'] },
      { heading: 'Draconic Stones', points: ['Unlock at Dragon Lv. 30; Nature slot at Lv. 40, Wild slot at Lv. 50.', 'Five qualities: Common, Uncommon, Superb, Epic, Legendary. Higher quality = better stats.', 'Only equipped stones count. Each slot takes its own type, and you cannot equip two of the same type.', 'Upgrade or Ascend stones to raise them; upgraded or ascended stones can be reset to their starting state.'] },
      { heading: 'Which stone gives what (wiki)', points: ['Fiery: Cavalry ATK, Archer DEF, Troop HP.', 'Frost: Infantry ATK, Cavalry DEF, Troop HP.', 'Hurricane: Infantry ATK, Archer HP, Troop DEF.', 'Lightning: Archer ATK, Infantry DEF, Troop HP.', 'Meteor: Cavalry ATK, Infantry HP, Troop DEF.', 'Hydro: Archer ATK, Cavalry HP, Troop DEF.', 'Nature (Dragon Lv. 40) and Wild (Lv. 50): Troop ATK, DEF and HP.'] },
      { heading: 'Stone strength by quality (wiki, enhance Lv. 1)', points: ['Common 4★: +5% unit stat, +2.5% troop stat.', 'Uncommon 4★: +10% / +5%.', 'Superb 5★: +27% / +13.5%.', 'Epic 4★: +32% / +16%.', 'Legendary 4★: +50% / +25%; 6★: +100% / +50%.', 'Enhancing and ascending (5★, 6★ and beyond, paid in same-quality shards) raise these a lot.', 'Checked in-game: Common 6★ +1 = 10% / 5% (+2 = 10.7% / 5.35%); Uncommon 4★ +3 = 12.8% / 6.4%, +4 = 14.6% / 7.3%, +5 = 16.8% / 8.4%.', 'Top seen in-game: Legendary +20, fully ascended = +626.8% unit stats and +313.4% Troop stat, 10,000,000 power.', 'Enhance EXP (in-game): Common +1→+2 1,000; Uncommon +3→+4 7,500 and +4→+5 10,000.', 'Duplicate stones turn into shards automatically.'] },
      { heading: 'Draconic Altar (wiki)', points: ['Wish for stones of all 5 qualities; wish rewards reset every Monday.', 'Weekly wish goals: 10 wishes = Uncommon stone choice chest, 30 = Superb, 200 = Epic, 300 = Legendary choice chest (plus Draconic Holy Water).', 'Wishing in sets of 10 costs 9 candles.'] },
      { heading: 'Dragon EXP (wiki)', points: ['To Lv. 30: 851,000 · Lv. 35: 2.12M · Lv. 40: 4.74M · Lv. 42: 6.35M (matches the game) · Lv. 45: 9.54M · Lv. 50: 17.2M · Lv. 55–59 not listed · Lv. 60: 39.7M.', 'Skill unlocks by Dragon level: Gather Food 2, Cavalry ATK 3, Gather Wood 4, Archer ATK 6, Troop Load 7, Troop Capacity 9, Construction Speed 11, Vehicle ATK 12, Gather Stone 13, Infantry HP 16, Research Speed 17, Cavalry HP 20, Gather Iron 22, Archer HP 25, Gather Resource 27, Vehicle HP 30, Troop DEF 35, March Speed 36, Troop HP 40, Training Speed 41, Rescue Units 44, Troop ATK 45, Troop Dmg Taken Down 55, Troop Dmg Up 60.', 'What each skill level is worth is not on the wiki; see the in-game values above.'] },
      { heading: 'Draconic Stone Refinement', points: ['Refinement Lv. 0 → 1 gives Troop ATK, DEF and HP +2% each.', 'It needs 6 equipped 4★ stones of Uncommon quality or better, plus 50 Refinement Crests.'] },
    ],
  },
];

export const checklistTemplate: ChecklistTemplateItem[] = [
  { id: 'essence-trick', label: '1-Essence daily quest', detail: 'Use a single Gear/Rune/Totem essence to complete the daily quest.', castle: 'all' },
  { id: 'greenhouse', label: 'Greenhouse seed refresh', detail: 'Replant and refresh seeds.', castle: 'all' },
  { id: 'instant-output', label: 'Instant Output', detail: '12-hour cooldown — claim twice daily.', cooldownHours: 12, castle: 'all' },
  { id: 'dragon', label: 'Dragon interactions', detail: 'Feed, pet and collect Dragon rewards.', castle: 'all' },
  { id: 'trial-turret', label: 'Trial Turret', detail: 'Use daily attempts.', castle: 'main' },
  { id: 'mesdi', label: 'Mesdi Portal', detail: 'Push the next chapter or sweep.', castle: 'main' },
  { id: 'alliance-help', label: 'Alliance help & gifts', detail: 'Help all, claim alliance gifts, donate tech.', castle: 'all' },
  { id: 'alliance-party', label: 'Alliance Party / Trial', detail: 'Join the party and use trial attempts.', castle: 'main' },
  { id: 'black-market', label: 'Black Market refresh', detail: 'Buy resource-priced speedups; items change every 3 hours (lock good offers to keep them).', castle: 'all' },
  { id: 'gather', label: 'Gather marches out', detail: 'Keep every march queue busy.', castle: 'all' },
];
