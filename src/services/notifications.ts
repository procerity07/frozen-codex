import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { GameEvent } from '@/types/game';
import { nextUtcOccurrence } from '@/lib/time';
import { weeklyTriggers, type Reminder } from '@/lib/reminders';

const CHANNEL = 'events';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Event alarms', importance: Notifications.AndroidImportance.HIGH, lightColor: '#38BDF8', vibrationPattern: [0, 200, 120, 200],
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

const tag = (eventId: string, day: string) => `evt:${eventId}:${day}`;

/** Schedules weekly repeating alarms (one per event weekday) `leadMinutes` before the UTC start. */
export async function scheduleEventAlarm(event: GameEvent, leadMinutes: number): Promise<number> {
  await cancelEventAlarm(event.id);
  if (!event.days.length) return 0;
  let n = 0;
  for (const day of event.days) {
    const at = new Date(nextUtcOccurrence(new Date(), day, event.startUtc).getTime() - leadMinutes * 60_000);
    await Notifications.scheduleNotificationAsync({
      identifier: tag(event.id, day),
      content: { title: event.name, body: `Starts in ${leadMinutes} min (${event.startUtc} UTC). ${event.summary}`, data: { eventId: event.id } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: at.getDay() + 1,
        hour: at.getHours(),
        minute: at.getMinutes(),
        channelId: CHANNEL,
      },
    });
    n++;
  }
  return n;
}

export async function cancelEventAlarm(eventId: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter((r) => r.identifier.startsWith(`evt:${eventId}:`)).map((r) => Notifications.cancelScheduledNotificationAsync(r.identifier)));
}

/** One-shot cooldown alarm (Instant Output etc). */
export async function scheduleCooldown(id: string, title: string, seconds: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`cd:${id}`).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: `cd:${id}`,
    content: { title, body: 'Cooldown finished — ready to claim.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(60, Math.round(seconds)), channelId: CHANNEL },
  });
}

export async function scheduleDailyReset(on: boolean, leadMinutes: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-reset').catch(() => undefined);
  if (!on) return;
  const now = new Date();
  const nextUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0);
  const at = new Date(nextUtcMidnight - leadMinutes * 60_000);
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reset',
    content: { title: 'Daily reset soon', body: `00:00 UTC reset in ${leadMinutes} min — finish dailies on every castle.` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: at.getHours(), minute: at.getMinutes(), channelId: CHANNEL },
  });
}

const remTag = (id: string) => `rem:${id}:`;

/** Cancels every scheduled notification of one user reminder. */
export async function cancelReminder(id: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter((r) => r.identifier.startsWith(remTag(id))).map((r) => Notifications.cancelScheduledNotificationAsync(r.identifier)));
}

/** (Re)schedules a user reminder as weekly repeating notifications. Returns how many were set. */
export async function scheduleReminder(r: Reminder): Promise<number> {
  await cancelReminder(r.id);
  if (!r.enabled) return 0;
  const triggers = weeklyTriggers(r);
  for (const t of triggers) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${remTag(r.id)}${t.weekday}-${t.hour}-${t.minute}`,
      content: { title: r.title || 'Frozen Codex reminder', body: `Your reminder (${r.time} ${r.zone === 'utc' ? 'UTC' : 'local'}).` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute, channelId: CHANNEL },
    });
  }
  return triggers.length;
}
