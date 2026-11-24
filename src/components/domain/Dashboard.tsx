import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CalendarClock, Clock, Sparkles } from 'lucide-react-native';
import { events } from '@/data/seed';
import whatsNew from '@/data/whatsNew.json';
import { palette, radius, space, type } from '@/theme';
import { BottomSheet, Button, Card, Row, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { cycleForDate, formatDuration, msUntilUtcMidnight, nextUtcOccurrence, utcWeekStart } from '@/lib/time';
import { eventsOn } from '@/lib/schedule';
import { nextOccurrence } from '@/lib/reminders';
import { CURRENT_VERSION } from '@/services/appUpdate';
import { scheduleAllianceEventAlarm, scheduleReminder } from '@/services/notifications';
import { upcomingStarts } from '@/lib/allianceTimes';
import { ReleaseNotes } from './UpdateBanner';

const WEEK_MS = 7 * 86_400_000;

/** "At a glance" card: reset countdowns, the next big event, tomorrow's new events and the next personal reminder. */
export function Dashboard({ now }: { now: Date }) {
  const s = useAppStore();
  const anchors = { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek };
  const weeklyMs = utcWeekStart(now).getTime() + WEEK_MS - now.getTime();
  const nextCycle = cycleForDate(new Date(now.getTime() + weeklyMs + 1000), s.aceLordAnchorWeek);

  // Next timed war event (Conquest of Lords / Realm Expedition) within the next 7 days.
  const war = events
    .filter((e) => e.startUtc !== '00:00' && e.days.length)
    .flatMap((e) => e.days.map((d) => ({ e, at: nextUtcOccurrence(now, d, e.startUtc) })))
    .filter(({ e, at }) => eventsOn([e], at, anchors).length > 0)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

  const tomorrow = new Date(now.getTime() + msUntilUtcMidnight(now) + 60_000);
  const todayIds = new Set(eventsOn(events, now, anchors).map((e) => e.id));
  const startingTomorrow = eventsOn(events, tomorrow, anchors).filter((e) => e.category !== 'Core Cycle' && !todayIds.has(e.id));

  const nextAlliance = Object.entries(s.allianceTimes)
    .map(([id, at]) => { const e = events.find((x) => x.id === id); return e ? { e, at: upcomingStarts(e, at, now, anchors, 14)[0] } : null; })
    .filter((x): x is { e: (typeof events)[number]; at: Date } => !!x && !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

  const nextReminder = s.reminders
    .filter((r) => r.enabled)
    .map((r) => ({ r, at: nextOccurrence(r, now) }))
    .filter((x): x is { r: typeof x.r; at: Date } => !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];

  // Re-schedule reminders once per launch so daylight-saving changes never shift them.
  const rescheduled = useRef(false);
  useEffect(() => {
    if (rescheduled.current) return;
    rescheduled.current = true;
    const st = useAppStore.getState();
    for (const r of st.reminders) if (r.enabled) scheduleReminder(r).catch(() => undefined);
    // Alliance-time alarms are one-off, so top them up for the coming weeks.
    const a = { aceLordAnchorWeek: st.aceLordAnchorWeek, rotationAnchorWeek: st.rotationAnchorWeek };
    for (const [id, at] of Object.entries(st.allianceTimes)) {
      const e = events.find((x) => x.id === id);
      if (e && st.alarms[id]) scheduleAllianceEventAlarm(e, at, st.alarmLeadMinutes, a).catch(() => undefined);
    }
  }, []);

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Countdown icon={Clock} label="Daily reset" value={formatDuration(msUntilUtcMidnight(now))} />
        <Countdown icon={CalendarClock} label={`Weekly reset · ${nextCycle} next`} value={formatDuration(weeklyMs)} align="right" />
      </Row>
      {war ? (
        <Pressable onPress={() => router.push(`/event/${war.e.id}`)} style={st.line}>
          <Text style={type.caption}>Next war event</Text>
          <Text style={type.body}><Text style={{ fontWeight: '700' }}>{war.e.name}</Text> in {formatDuration(war.at.getTime() - now.getTime())}</Text>
        </Pressable>
      ) : null}
      {nextAlliance ? (
        <Pressable onPress={() => router.push(`/event/${nextAlliance.e.id}`)} style={st.line}>
          <Text style={type.caption}>Next alliance event (your alliance's time)</Text>
          <Text style={type.body}><Text style={{ fontWeight: '700' }}>{nextAlliance.e.name}</Text> in {formatDuration(nextAlliance.at.getTime() - now.getTime())}</Text>
        </Pressable>
      ) : null}
      {startingTomorrow.length ? (
        <View style={st.line}>
          <Text style={type.caption}>Starting at the next reset</Text>
          <Text style={type.body}>{startingTomorrow.map((e) => e.name).join(' · ')}</Text>
        </View>
      ) : null}
      <Pressable onPress={() => { haptic(); router.push('/tools/reminders'); }} style={[st.line, { flexDirection: 'row', alignItems: 'center', gap: space.sm }]} accessibilityRole="button">
        <Bell size={15} color={palette.gold} />
        <Text style={[type.body, { flex: 1 }]}>
          {nextReminder ? <>{nextReminder.r.title} in <Text style={{ color: palette.gold }}>{formatDuration(nextReminder.at.getTime() - now.getTime())}</Text></> : 'Set up your own reminders'}
        </Text>
        <Text style={type.caption}>{s.reminders.length ? 'Manage' : 'Add'}</Text>
      </Pressable>
    </Card>
  );
}

function Countdown({ icon: Icon, label, value, align = 'left' }: { icon: typeof Clock; label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <View style={{ flex: 1, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Row gap={4}><Icon size={13} color={palette.textMuted} /><Text style={type.caption}>{label}</Text></Row>
      <Text style={[type.number, { marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

/** Shows the notes of the installed version once after an update. Also opened from Settings. */
export function WhatsNewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet visible={open} onClose={onClose} title={`What's new in v${CURRENT_VERSION}`} subtitle="Changes since the version you had before">
      <ReleaseNotes notes={whatsNew.notes} />
      <View style={{ marginTop: space.lg }}><Button icon={Sparkles} label="Got it" onPress={onClose} /></View>
    </BottomSheet>
  );
}

export const hasWhatsNew = () => whatsNew.version === CURRENT_VERSION && whatsNew.notes.trim().length > 0;

/** Opens the What's new sheet automatically the first time a new version starts. */
export function AutoWhatsNew() {
  const seen = useAppStore((s) => s.seenWhatsNew);
  const setSeen = useAppStore((s) => s.setSeenWhatsNew);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!hasWhatsNew() || seen === CURRENT_VERSION) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [seen]);
  return <WhatsNewSheet open={open} onClose={() => { setOpen(false); setSeen(CURRENT_VERSION); }} />;
}

const st = StyleSheet.create({
  line: { marginTop: space.md, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border, borderRadius: radius.sm },
});
