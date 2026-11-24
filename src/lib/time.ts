import type { CycleWeek, Weekday } from '@/types/game';

export const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
/** Monday 1970-01-05 00:00 UTC — week index origin. */
const EPOCH_MONDAY = Date.UTC(1970, 0, 5);

export const pad = (n: number) => String(n).padStart(2, '0');

export function utcClock(d: Date): string {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Countdown text: "05:12:09" under a day, "2d 03h 12m 09s" from 24 hours up. */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s % 60)}s`;
  return `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

export function formatDurationShort(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${m}m ${pad(s % 60)}s`;
}

export function msUntilUtcMidnight(d: Date): number {
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return next - d.getTime();
}

export function utcWeekday(d: Date): Weekday {
  return WEEKDAYS[(d.getUTCDay() + 6) % 7]!;
}

/** 1-based day of the UTC week (Mon = 1). */
export function utcDayOfWeek(d: Date): number {
  return ((d.getUTCDay() + 6) % 7) + 1;
}

export function weekIndex(d: Date): number {
  return Math.floor((d.getTime() - EPOCH_MONDAY) / WEEK_MS);
}

/** Anchor: a week index known to be an Ace Lord Week. */
export function cycleForDate(d: Date, aceLordAnchorWeek: number): Exclude<CycleWeek, 'Both' | 'Random'> {
  return ((weekIndex(d) - aceLordAnchorWeek) % 2 + 2) % 2 === 0 ? 'Ace Lord' : 'Arms Race';
}

/** 1..4 sub-rotation; anchor is a week index known to be rotation week 1. */
export function rotationWeek(d: Date, rotationAnchorWeek: number): 1 | 2 | 3 | 4 {
  return ((((weekIndex(d) - rotationAnchorWeek) % 4) + 4) % 4 + 1) as 1 | 2 | 3 | 4;
}

/** Start of the UTC week (Monday 00:00) containing d. */
export function utcWeekStart(d: Date): Date {
  return new Date(EPOCH_MONDAY + weekIndex(d) * WEEK_MS);
}

/** Next Date (>= now) at which a weekday + "HH:MM" UTC occurs. */
export function nextUtcOccurrence(now: Date, weekday: Weekday, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const start = utcWeekStart(now).getTime() + WEEKDAYS.indexOf(weekday) * DAY_MS + h * 3600_000 + m * 60_000;
  return new Date(start >= now.getTime() ? start : start + WEEK_MS);
}

/** Converts a UTC weekday + time to the device's local "Ddd HH:MM". */
export function utcToLocalLabel(weekday: Weekday, hhmm: string, ref = new Date()): string {
  const d = nextUtcOccurrence(ref, weekday, hhmm);
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localOffsetLabel(ref = new Date()): string {
  const off = -ref.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + pad(a % 60) : ''}`;
}

/** Royal Arms Race slot (1-3) currently active for a UTC time. */
export function royalSlot(d: Date): 1 | 2 | 3 {
  const h = d.getUTCHours();
  return h < 8 ? 1 : h < 16 ? 2 : 3;
}
