/** Today's events for the Command page: when each starts (alliance time if set) and whether it is live. */
import type { GameEvent } from '@/types/game';
import { eventsOn, type Anchors } from '@/lib/schedule';
import { isAllianceTimed, upcomingStarts, type AllianceTime } from '@/lib/allianceTimes';
import { parseTime } from '@/lib/reminders';

export type TodayStatus = 'live' | 'upcoming' | 'ended';
export interface TodayRow { ev: GameEvent; start: Date; end: Date; status: TodayStatus; allianceTime: boolean }

const DAY = 86_400_000;

export function todayEventRows(events: GameEvent[], now: Date, anchors: Anchors, allianceTimes: Record<string, AllianceTime>): TodayRow[] {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const yesterday = new Date(dayStart - DAY / 2);
  const rows: TodayRow[] = [];
  const seen = new Set<string>();
  const add = (ev: GameEvent, start: Date, allianceTime: boolean) => {
    let end = new Date(start.getTime() + Math.max(0.25, ev.durationHours || 1) * 3_600_000);
    // Multi-day events: the run ends at the end of the last consecutive day it is on, not "today + full length".
    // A 24-hour event (e.g. one Elemental Seal a day) ends tonight even when it runs on the next day too.
    if (!allianceTime && (ev.durationHours || 0) > 24) {
      let d = 0;
      // Week-long events stop at the weekly reset; shorter runs (e.g. Scorching Front Sat–Mon) may cross it.
      const weekLong = ev.durationHours >= 168;
      const toSunday = weekLong ? 6 - (new Date(dayStart).getUTCDay() + 6) % 7 : 6;
      while (d < toSunday && eventsOn([ev], new Date(dayStart + (d + 1) * DAY + DAY / 2), anchors).length) d++;
      let back = 0;
      // Runs don't cross the weekly reset (Monday 00:00 UTC).
      const weekday = (new Date(dayStart).getUTCDay() + 6) % 7; // Mon = 0
      while (back < (weekLong ? weekday : 6) && eventsOn([ev], new Date(dayStart - (back + 1) * DAY + DAY / 2), anchors).length) back++;
      const runEnd = dayStart - back * DAY + ev.durationHours * 3_600_000;
      end = new Date(Math.min(dayStart + (d + 1) * DAY, Math.max(runEnd, dayStart + DAY)));
    }
    const status: TodayStatus = now < start ? 'upcoming' : now < end ? 'live' : 'ended';
    rows.push({ ev, start, end, status, allianceTime });
    seen.add(ev.id);
  };
  for (const ev of events) {
    if (ev.category === 'Core Cycle' && events.length > 1) continue;
    const at = isAllianceTimed(ev.id) ? allianceTimes[ev.id] : undefined;
    if (at) {
      // Alliance's own time (and days / planned date) decides whether it is on today.
      const s = upcomingStarts(ev, at, yesterday, anchors, 2).find((d) => d.getTime() >= dayStart && d.getTime() < dayStart + DAY);
      if (s) add(ev, s, true);
      continue;
    }
    if (!eventsOn([ev], now, anchors).length) continue;
    const t = parseTime(ev.startUtc) ?? [0, 0];
    add(ev, new Date(dayStart + (t[0] * 60 + t[1]) * 60_000), false);
  }
  const rank: Record<TodayStatus, number> = { live: 0, upcoming: 1, ended: 2 };
  return rows.sort((a, b) => rank[a.status] - rank[b.status] || a.start.getTime() - b.start.getTime());
}

/** The event's current run, or its next one within two weeks (uses your alliance's time if set). */
export function nextRun(ev: GameEvent, now: Date, anchors: Anchors, allianceTimes: Record<string, AllianceTime>): TodayRow | null {
  const today = todayEventRows([ev], now, anchors, allianceTimes).find((r) => r.status !== 'ended');
  if (today) return today;
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (let i = 1; i <= 14; i++) {
    const r = todayEventRows([ev], new Date(dayStart + i * DAY), anchors, allianceTimes)[0];
    if (r) return { ...r, status: 'upcoming' };
  }
  return null;
}
