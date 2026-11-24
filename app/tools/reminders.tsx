import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { BellPlus, Pencil, Trash } from 'lucide-react-native';
import { palette, radius, space, type } from '@/theme';
import { Button, Card, EmptyState, Field, IconButton, Row, Screen, SectionHeader, Segmented, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { DAY_LABELS, describeDays, nextOccurrence, normalizeTime, type Reminder } from '@/lib/reminders';
import { formatDuration } from '@/lib/time';
import { cancelReminder, ensurePermission, scheduleReminder } from '@/services/notifications';

const PRESETS: { title: string; days: number[]; time: string; zone: Reminder['zone'] }[] = [
  { title: 'Collect Instant Output', days: [], time: '12:00', zone: 'utc' },
  { title: 'Alliance help & donations', days: [], time: '20:00', zone: 'local' },
  { title: 'Weekly shops reset', days: [0], time: '00:00', zone: 'utc' },
];

const blank = (): Reminder => ({ id: `r${Date.now().toString(36)}`, title: '', days: [], time: '', zone: 'utc', enabled: true });

/** Reminders the player builds: any title, chosen days, a time in game (UTC) or local time. */
export default function RemindersScreen() {
  const now = useNow(1000);
  const reminders = useAppStore((s) => s.reminders);
  const save = useAppStore((s) => s.saveReminder);
  const remove = useAppStore((s) => s.removeReminder);
  const [draft, setDraft] = useState<Reminder | null>(null);

  const persist = async (r: Reminder) => {
    if (r.enabled && !(await ensurePermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Frozen Codex in Android settings to get reminders.');
      return false;
    }
    save(r);
    await scheduleReminder(r).catch(() => undefined);
    return true;
  };

  const submit = async () => {
    if (!draft) return;
    const time = normalizeTime(draft.time);
    if (!time) { Alert.alert('Check the time', 'Use 24-hour time, for example 07:30 or 21:00.'); return; }
    const r = { ...draft, title: draft.title.trim() || 'Reminder', time };
    if (await persist(r)) setDraft(null);
  };

  const sorted = [...reminders].sort((a, b) => (nextOccurrence(a, now)?.getTime() ?? Infinity) - (nextOccurrence(b, now)?.getTime() ?? Infinity));

  return (
    <Screen>
      <Stack.Screen options={{ title: 'My reminders' }} />
      <Text style={type.bodySecondary}>Make your own notifications for anything: shop resets, alliance help, a farm castle, an event time. Game time is UTC; local time follows your phone.</Text>

      {draft ? (
        <Card style={{ marginTop: space.md }}>
          <Field label="What to remind you about" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} placeholder="e.g. Black Market refresh" />
          <Row style={{ marginTop: space.sm }}>
            <Field label="Time (24-hour)" value={draft.time} onChangeText={(time) => setDraft({ ...draft, time })} placeholder="21:00" keyboardType="numbers-and-punctuation" />
            <View style={{ flex: 1 }}>
              <Text style={type.label}>Time zone</Text>
              <View style={{ marginTop: 6 }}>
                <Segmented options={['utc', 'local'] as const} value={draft.zone} onChange={(zone) => setDraft({ ...draft, zone })} labels={{ utc: 'Game (UTC)', local: 'My time' }} />
              </View>
            </View>
          </Row>
          <Text style={[type.label, { marginTop: space.md }]}>Days ({describeDays(draft.days)})</Text>
          <Row gap={6} style={{ marginTop: 6, flexWrap: 'wrap' }}>
            {DAY_LABELS.map((d, i) => {
              const on = draft.days.includes(i);
              return (
                <Pressable key={d} onPress={() => { haptic(); setDraft({ ...draft, days: on ? draft.days.filter((x) => x !== i) : [...draft.days, i] }); }} style={[st.day, on && st.dayOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Text style={[type.caption, on && { color: palette.text }]}>{d}</Text>
                </Pressable>
              );
            })}
          </Row>
          <Text style={[type.caption, { marginTop: 4 }]}>No days selected = every day.</Text>
          <Row style={{ marginTop: space.md }}>
            <View style={{ flex: 1 }}><Button variant="secondary" label="Cancel" onPress={() => setDraft(null)} /></View>
            <View style={{ flex: 1 }}><Button label="Save reminder" onPress={() => { submit().catch(() => undefined); }} /></View>
          </Row>
        </Card>
      ) : (
        <View style={{ marginTop: space.md }}>
          <Button icon={BellPlus} label="New reminder" onPress={() => setDraft(blank())} />
        </View>
      )}

      <SectionHeader title="Your reminders" subtitle={`${reminders.length} saved`} />
      {sorted.length ? sorted.map((r) => {
        const next = r.enabled ? nextOccurrence(r, now) : null;
        return (
          <Card key={r.id} style={{ marginBottom: space.sm }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={type.heading}>{r.title}</Text>
                <Text style={type.caption}>{describeDays(r.days)} · {r.time} {r.zone === 'utc' ? 'UTC' : 'local'}</Text>
                <Text style={[type.numberSmall, { marginTop: 4, color: next ? palette.cyan : palette.textMuted }]}>{next ? `in ${formatDuration(next.getTime() - now.getTime())}` : 'Off'}</Text>
              </View>
              <Switch value={r.enabled} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text}
                onValueChange={(enabled) => { persist({ ...r, enabled }).catch(() => undefined); }} />
            </Row>
            <Row style={{ marginTop: space.sm, justifyContent: 'flex-end' }}>
              <IconButton icon={Pencil} label="Edit reminder" onPress={() => setDraft(r)} />
              <IconButton icon={Trash} label="Delete reminder" color={palette.danger} onPress={() => { remove(r.id); cancelReminder(r.id).catch(() => undefined); }} />
            </Row>
          </Card>
        );
      }) : <EmptyState title="No reminders yet" body="Tap New reminder, or start from an idea below." />}

      <SectionHeader title="Ideas" />
      {PRESETS.map((p) => (
        <Pressable key={p.title} onPress={() => setDraft({ ...blank(), ...p })} style={st.preset}>
          <Text style={type.body}>{p.title}</Text>
          <Text style={type.caption}>{describeDays(p.days)} · {p.time} {p.zone === 'utc' ? 'UTC' : 'local'}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  day: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  dayOn: { borderColor: palette.cyan, backgroundColor: palette.cyanDim },
  preset: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, backgroundColor: palette.surface },
});
