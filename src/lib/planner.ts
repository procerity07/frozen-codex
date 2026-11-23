import { cycleDays, royalArmsRace } from '@/data/seed';
import type { Weekday } from '@/types/game';

const TAGS: Record<string, string[]> = {
  hero: ['hero', 'shard', 'bond', 'scroll'],
  build: ['build', 'construction', 'development'],
  research: ['research', 'development'],
  training: ['training', 'troops trained'],
  speedup: ['speedup'],
  stamina: ['stamina', 'ap'],
  draconic: ['draconic'],
  essence: ['essence', 'spinel', 'crystal', 'material'],
  rune: ['rune', 'holystone'],
  dragon: ['dragon'],
  totem: ['totem'],
  glory: ['glory'],
  curio: ['curio'],
  diamond: ['diamond'],
  kill: ['kill', 'duel moment'],
};

export function tagsFor(text: string): Set<string> {
  const t = text.toLowerCase();
  const out = new Set<string>();
  for (const [tag, kws] of Object.entries(TAGS)) if (kws.some((k) => t.includes(k))) out.add(tag);
  return out;
}

export interface DoubleDipRow {
  weekday: Weekday;
  aceLord: string;
  allianceDuel: string;
  royal: { utc: string; theme: string }[];
  shared: string[];
  advice: string;
}

const dayText = (eventId: string, weekday: Weekday) => {
  const d = cycleDays.find((c) => c.eventId === eventId)?.days.find((x) => x.weekday === weekday);
  return d ? { theme: d.theme, full: `${d.theme} ${d.scoring.join(' ')}` } : { theme: '—', full: '' };
};

export function doubleDipPlan(): DoubleDipRow[] {
  const days: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((weekday) => {
    const al = dayText('ace-lord', weekday);
    const ad = dayText('alliance-duel', weekday);
    const royalDay = ['Thu', 'Fri', 'Sat', 'Sun'].includes(weekday);
    const royal = royalDay ? royalArmsRace.flatMap((s) => s.themes.map((theme) => ({ utc: s.utc, theme }))) : [];
    const alTags = tagsFor(al.full);
    const adTags = tagsFor(ad.full);
    const shared = [...alTags].filter((t) => adTags.has(t));
    const royalShared = royal.filter((r) => [...tagsFor(r.theme)].some((t) => alTags.has(t) || adTags.has(t)));
    let advice: string;
    if (shared.length) advice = `Double-dip: ${shared.join(', ')} items score in both Ace Lord and Alliance Duel today.`;
    else advice = `No overlap — spend ${al.theme} items for Ace Lord; hold ${ad.theme} items for the Duel.`;
    if (royalShared.length) advice += ` Possible triple-dip if Royal Arms Race draws: ${royalShared.map((r) => `${r.theme} (${r.utc} UTC)`).join('; ')}.`;
    return { weekday, aceLord: al.theme, allianceDuel: ad.theme, royal, shared, advice };
  });
}
