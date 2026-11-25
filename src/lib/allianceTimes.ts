/** Event start times chosen by your alliance (pure logic, testable in Node). */
import type { GameEvent, Weekday } from '@/types/game';
import { isEventOn, type Anchors } from '@/lib/schedule';
import { weekIndex } from '@/lib/time';
import { normalizeTime, parseTime } from '@/lib/reminders';

export interface AllianceTime {
  /** "HH:MM". */
  time: string;
  /** Optional second time used on alternate weeks. */
  altTime?: string;
  /** Week index (Monday-based UTC weeks) that uses `time`; the weeks either side use `altTime`. */
  anchorWeek: number;
  zone: 'utc' | 'local';
  /** Days your alliance runs it on (game/UTC days). Omitted = the event's normal days. */
  days?: Weekday[];
  /** One planned run on a chosen date ("YYYY-MM-DD", game/UTC date) at `dateTime` (or the usual time). */
  date?: string;
  dateTime?: string;
}

/** Events whose start time each alliance decides. */
export const ALLIANCE_TIMED_EVENTS = ['infernal-gate', 'undead-scourge', 'alliance-trial', 'alliance-party', 'shadow-expedition', 'fort-contest', 'alliance-defense', 'oblivion-war'] as const;
export const isAllianceTimed = (eventId: string) => (ALLIANCE_TIMED_EVENTS as readonly string[]).includes(eventId);

const DAY_MS = 86_400_000;

/** The time that applies in the week containing `d`. */
export function timeForWeek(at: AllianceTime, d: Date): string {
  if (!at.altTime) return at.time;
  return ((weekIndex(d) - at.anchorWeek) % 2 + 2) % 2 === 0 ? at.time : at.altTime;
}

/** Which of the two times this week uses: 'A' (time) or 'B' (altTime). */
export const currentSlot = (at: AllianceTime, now: Date): 'A' | 'B' => (at.altTime && timeForWeek(at, now) === at.altTime && at.altTime !== at.time ? 'B' : 'A');

/** Makes `slot` the time used in the week of `now`. */
export const anchorFor = (now: Date, slot: 'A' | 'B') => weekIndex(now) + (slot === 'A' ? 0 : 1);

const WD: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startAt(day: Date, hhmm: string, zone: AllianceTime['zone']): Date | null {
  const t = parseTime(hhmm);
  if (!t) return null;
  return zone === 'utc'
    ? new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), t[0], t[1]))
    : new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), t[0], t[1]);
}

/** The planned one-off run, if one is set. */
export function plannedStart(at: AllianceTime): Date | null {
  const m = at.date && /^(\d{4})-(\d{2})-(\d{2})$/.exec(at.date);
  if (!m) return null;
  return startAt(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)), at.dateTime ?? at.time, at.zone);
}

/**
 * Upcoming start times of an event at the alliance's chosen time, within `days` days. Uses the alliance's own
 * days when set; a planned date replaces the regular run on that day.
 */
export function upcomingStarts(ev: GameEvent, at: AllianceTime, now: Date, anchors: Anchors, days = 42): Date[] {
  const out: Date[] = [];
  const planned = plannedStart(at);
  const plannedDay = planned ? at.date : null;
  for (let i = -1; i <= days; i++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, 12));
    if (plannedDay && day.toISOString().slice(0, 10) === plannedDay) continue;
    const on = at.days?.length ? at.days.includes(WD[day.getUTCDay()]!) : isEventOn(ev, day, anchors);
    if (!on) continue;
    const start = startAt(day, timeForWeek(at, day), at.zone);
    if (start && start.getTime() >= now.getTime()) out.push(start);
  }
  if (planned && planned.getTime() >= now.getTime()) out.push(planned);
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Validates user input; null when the main time is invalid. A blank or invalid second time turns alternation off. */
export function cleanAllianceTime(raw: { time: string; altTime?: string; zone: AllianceTime['zone']; anchorWeek: number; days?: Weekday[]; date?: string; dateTime?: string }): AllianceTime | null {
  const time = normalizeTime(raw.time);
  if (!time) return null;
  const alt = raw.altTime ? normalizeTime(raw.altTime) : null;
  const days = (raw.days ?? []).filter((d) => WD.includes(d));
  const date = raw.date && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : undefined;
  const dateTime = date && raw.dateTime ? normalizeTime(raw.dateTime) : null;
  return {
    time, ...(alt && alt !== time ? { altTime: alt } : {}), zone: raw.zone, anchorWeek: raw.anchorWeek,
    ...(days.length ? { days: WD.filter((d) => days.includes(d)) } : {}),
    ...(date ? { date } : {}), ...(dateTime ? { dateTime } : {}),
  };
}
