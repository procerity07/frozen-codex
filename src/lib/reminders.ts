/** Pure logic for user-made reminders (no React Native imports, so it is testable in Node). */

export interface Reminder {
  id: string;
  title: string;
  /** Days of the week, 0 = Monday … 6 = Sunday. Empty = every day. */
  days: number[];
  /** "HH:MM" */
  time: string;
  /** Whether `days`/`time` are game time (UTC) or the phone's local time. */
  zone: 'utc' | 'local';
  enabled: boolean;
}

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_MS = 86_400_000;

export function parseTime(hhmm: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? [h, min] : null;
}

export function normalizeTime(hhmm: string): string | null {
  const t = parseTime(hhmm);
  return t ? `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}` : null;
}

const activeDays = (r: Reminder) => (r.days.length ? [...new Set(r.days)].filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6]);

/** Monday-based weekday (0 = Mon) of a date in UTC or local time. */
const mondayIndex = (d: Date, zone: Reminder['zone']) => ((zone === 'utc' ? d.getUTCDay() : d.getDay()) + 6) % 7;

/** Next time the reminder fires at or after `now`; null when the time is invalid. */
export function nextOccurrence(r: Reminder, now: Date): Date | null {
  const t = parseTime(r.time);
  if (!t) return null;
  const days = activeDays(r);
  for (let i = 0; i <= 7; i++) {
    const base = new Date(now.getTime() + i * DAY_MS);
    const at = r.zone === 'utc'
      ? new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), t[0], t[1]))
      : new Date(base.getFullYear(), base.getMonth(), base.getDate(), t[0], t[1]);
    if (at.getTime() >= now.getTime() && days.includes(mondayIndex(at, r.zone))) return at;
  }
  return null;
}

/**
 * Weekly notification triggers in the phone's local time: weekday 1 = Sunday … 7 = Saturday
 * (the format expo-notifications uses). UTC reminders are converted, so a UTC day can land on a
 * different local day.
 */
export function weeklyTriggers(r: Reminder, ref = new Date()): { weekday: number; hour: number; minute: number }[] {
  const t = parseTime(r.time);
  if (!t) return [];
  const out = new Map<string, { weekday: number; hour: number; minute: number }>();
  // Walk the coming week and take the local time of every occurrence.
  for (let i = 0; i < 7; i++) {
    const base = new Date(ref.getTime() + i * DAY_MS);
    const at = r.zone === 'utc'
      ? new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), t[0], t[1]))
      : new Date(base.getFullYear(), base.getMonth(), base.getDate(), t[0], t[1]);
    if (!activeDays(r).includes(mondayIndex(at, r.zone))) continue;
    const trig = { weekday: at.getDay() + 1, hour: at.getHours(), minute: at.getMinutes() };
    out.set(`${trig.weekday}:${trig.hour}:${trig.minute}`, trig);
  }
  return [...out.values()].sort((a, b) => a.weekday - b.weekday);
}

export function describeDays(days: number[]): string {
  const d = [...new Set(days)].sort();
  if (!d.length || d.length === 7) return 'Every day';
  if (d.join() === '0,1,2,3,4') return 'Weekdays';
  if (d.join() === '5,6') return 'Weekends';
  return d.map((i) => DAY_LABELS[i]).join(', ');
}
