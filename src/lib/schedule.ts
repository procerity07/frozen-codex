import type { GameEvent, Weekday } from '@/types/game';
import { cycleDays, events as allEvents } from '@/data/seed';
import { cycleForDate, rotationWeek, utcDayOfWeek, utcWeekday } from './time';

export interface Anchors { aceLordAnchorWeek: number; rotationAnchorWeek: number }

/** True when a scheduled event is live on the given UTC date. */
export function isEventOn(e: GameEvent, d: Date, a: Anchors, weekday: Weekday = utcWeekday(d)): boolean {
  if (!e.days.includes(weekday)) return false;
  const cycle = cycleForDate(d, a.aceLordAnchorWeek);
  if (e.cycleWeek !== 'Both' && e.cycleWeek !== 'Random' && e.cycleWeek !== cycle) return false;
  if (e.rotationWeek && rotationWeek(d, a.rotationAnchorWeek) !== e.rotationWeek) return false;
  return true;
}

export function eventsOn(events: GameEvent[], d: Date, a: Anchors): GameEvent[] {
  return events.filter((e) => isEventOn(e, d, a));
}

export function todayThemes(d: Date, a: Anchors): { label: string; theme: string; eventId: string }[] {
  const cycle = cycleForDate(d, a.aceLordAnchorWeek);
  const day = utcDayOfWeek(d);
  const pick = (id: string) => cycleDays.find((c) => c.eventId === id)?.days.find((x) => x.day === day);
  const out: { label: string; theme: string; eventId: string }[] = [];
  if (cycle === 'Ace Lord') {
    const al = pick('ace-lord');
    if (al) out.push({ label: `Ace Lord · Day ${day}`, theme: al.theme, eventId: 'ace-lord' });
  } else {
    const ar = pick('arms-race');
    if (ar) out.push({ label: `Arms Race · Day ${day}`, theme: ar.theme, eventId: 'arms-race' });
  }
  // Daily mini-events that run inside the cycle (e.g. Curio on Tuesday of Ace Lord weeks).
  for (const e of allEvents) {
    if (e.category === 'Core Cycle' && e.id !== 'ace-lord' && e.id !== 'arms-race' && isEventOn(e, d, a)) {
      out.push({ label: 'Daily event', theme: e.name.replace(' (Event)', ''), eventId: e.id });
    }
  }
  return out;
}

/** A 14-day calendar starting at the Monday of the current week. */
export function twoWeekCalendar(start: Date, events: GameEvent[], a: Anchors) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    return { date: d, cycle: cycleForDate(d, a.aceLordAnchorWeek), rotation: rotationWeek(d, a.rotationAnchorWeek), themes: todayThemes(d, a), events: eventsOn(events, d, a) };
  });
}
