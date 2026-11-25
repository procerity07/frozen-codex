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
    const end = new Date(start.getTime() + Math.max(0.25, ev.durationHours || 1) * 3_600_000);
    const status: TodayStatus = now < start ? 'upcoming' : now < end ? 'live' : 'ended';
    rows.push({ ev, start, end, status, allianceTime });
    seen.add(ev.id);
  };
  for (const ev of events) {
    if (ev.category === 'Core Cycle') continue;
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
