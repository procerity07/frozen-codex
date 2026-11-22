export type MailFormat = 'discord' | 'mail';

export interface MailInputs { tag: string; time: string; target: string; extra: string }

export interface MailTemplate { id: string; title: string; build: (i: MailInputs, f: MailFormat) => string }

const h = (t: string, f: MailFormat) => (f === 'discord' ? `**${t}**` : `【${t}】`);
const li = (items: string[], f: MailFormat) => items.map((x, i) => (f === 'discord' ? `- ${x}` : `${i + 1}. ${x}`)).join('\n');
const tagOr = (t: string) => t.trim() || 'our alliance';

export const mailTemplates: MailTemplate[] = [
  {
    id: 'col-nap', title: 'Conquest of Lords — NAP & tile trades',
    build: (i, f) => [
      h(`Conquest of Lords — ${i.time || 'Saturday 10:00 UTC'}`, f), '',
      `${tagOr(i.tag)} rules for this CoL:`,
      li([
        'NAP with realm allies — no hits on allied castles or gatherers.',
        'Hall of Might: hold 8 hours straight to auto-win; rotate garrisons every 2 hours.',
        'Spire cannons hit every 10 min for 1% garrison loss — keep garrisons topped up.',
        'Stay inside the Enchanted Woodland boundary when not attacking.',
        '30% of structure garrison losses are permanent — only send troops you can afford to lose.',
        `Agreed tile trades: ${i.target || 'see pinned sheet'} (1M power lost = 400 pts, 1M killed = 100 pts).`,
        'Personal target: 12,000 points.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 're-nap', title: 'Realm Expedition — invasion plan',
    build: (i, f) => [
      h(`Realm Expedition — ${i.time || 'Saturday 10:00 UTC'}`, f), '',
      li([
        `Teleport target realm: ${i.target || 'TBA by R5'}.`,
        'Foreign kills only: T1 = 0 pts, T2 = 1 … T11 = 80, T12 = 100 — hit T10+ marches.',
        'Diamond Mine gathering cap is 8,000 per Lord — stop gathering once capped.',
        'Wounded go to the Realm Hospital — do not panic-heal at home.',
        'Shield up before logging off.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 'undead', title: 'Undead Scourge — defence orders',
    build: (i, f) => [
      h(`Undead Scourge starts ${i.time || 'in 5 minutes'}`, f), '',
      li([
        '20 waves. No resources are lost.',
        'Arcane Barrier does NOT block undead — leave troops home.',
        'After failing twice the undead stop attacking you — then reinforce allies for points.',
        'Stay online for the Alliance Fortress boss at the end.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 'oblivion', title: 'Oblivion War — objectives',
    build: (i, f) => [
      h(`Oblivion War — ${i.time || 'check event tab'}`, f), '',
      li([
        `Priority target: ${i.target || 'Gate of Demise'}.`,
        'Occupy a structure for 3 minutes to capture it.',
        'Order: Gate of Demise › Ancient Ruins › Magic Altar › Temple of Life › Camps.',
        'Titan Colossus spawns from the Oblivion Pyramid — rally it together.',
        'Spend medals on Echo shards in the Oblivion War Shop.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 'fort', title: 'Fort Contest — time-slot vote',
    build: (i, f) => [
      h('Fort Contest — vote your slots', f), '',
      li([
        'Requirement: Citadel Lv. 10+. We register 1 Fort + 1 Fortress.',
        `Vote 3 of the 5 time slots. Preferred: ${i.time || 'reply with your best 3'}.`,
        'Battle phase lasts 2 hours. A 30-minute continuous hold or the longest total occupation wins.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 'infernal', title: 'Infernal Gate — rally call',
    build: (i, f) => [
      h(`Infernal Gate rally — ${i.time || 'now'}`, f), '',
      li([
        `Emissary level: ${i.target || 'TBA'} (Lv. 1–25, 20k to 120M HP).`,
        'Personal cooldown is 71 hours after participating — join the highest level you can.',
        'Rewards: Regal / Deluxe Recruit Tickets and Alliance Coins.',
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
  {
    id: 'showdown', title: 'Alliance Showdown — quest split',
    build: (i, f) => [
      h('Alliance Showdown this week', f), '',
      li([
        'Quests are shared — claim one only if you can finish it today.',
        'Citadel Lv. 15+ required; we need 20+ active members.',
        `Our league: ${i.target || 'Adept'}. Push for the next league chest.`,
      ], f),
      i.extra ? `\n${i.extra}` : '',
    ].join('\n').trim(),
  },
];
