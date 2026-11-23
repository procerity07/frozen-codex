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
      { heading: 'Order of protection', points: ['Medical Tent holds wounded first.', 'Overflow goes to the Sanctuary, revived free with Holy Light.', 'Alliance Hospital takes up to 100,000 more.', 'Anything beyond that is permanent death.'] },
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
