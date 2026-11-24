/** Event start times chosen by your alliance (pure logic, testable in Node). */
import type { GameEvent } from '@/types/game';
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
}

/** Events whose start time each alliance decides. */
export const ALLIANCE_TIMED_EVENTS = ['infernal-gate', 'undead-scourge', 'alliance-trial', 'alliance-party', 'shadow-expedition'] as const;
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

/** Upcoming start times of an event at the alliance's chosen time, within `days` days. */
export function upcomingStarts(ev: GameEvent, at: AllianceTime, now: Date, anchors: Anchors, days = 42): Date[] {
  const out: Date[] = [];
  for (let i = -1; i <= days; i++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, 12));
    if (!isEventOn(ev, day, anchors)) continue;
    const t = parseTime(timeForWeek(at, day));
    if (!t) continue;
    const start = at.zone === 'utc'
      ? new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), t[0], t[1]))
      : new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), t[0], t[1]);
    if (start.getTime() >= now.getTime()) out.push(start);
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Validates user input; null when the main time is invalid. A blank or invalid second time turns alternation off. */
export function cleanAllianceTime(raw: { time: string; altTime?: string; zone: AllianceTime['zone']; anchorWeek: number }): AllianceTime | null {
  const time = normalizeTime(raw.time);
  if (!time) return null;
  const alt = raw.altTime ? normalizeTime(raw.altTime) : null;
  return { time, ...(alt && alt !== time ? { altTime: alt } : {}), zone: raw.zone, anchorWeek: raw.anchorWeek };
}
