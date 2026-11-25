import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Users } from 'lucide-react-native';
import { events } from '@/data/seed';
import { todayEventRows, type TodayStatus } from '@/lib/todayEvents';
import { formatDuration } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { palette, radius, space, type } from '@/theme';
import { Button, Card, Row, SectionHeader, haptic } from '@/components/ui';
import type { EventCategory } from '@/types/game';

const CAT_COLOR: Record<EventCategory, string> = {
  'Core Cycle': palette.textSecondary, Weekly: palette.cyan, Alliance: palette.gold,
  'Cross-Realm War': palette.danger, 'Mini-Game': palette.success, 'Recruitment & Seasonal': '#A855F7',
};
const SHOW = 5;
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Today's events as a vertical list: live first, then upcoming, then ended. */
export function TodayEvents({ now }: { now: Date }) {
  const s = useAppStore();
  const anchors = { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek };
  const rows = useMemo(() => todayEventRows(events, now, anchors, s.allianceTimes), [now, s.aceLordAnchorWeek, s.rotationAnchorWeek, s.allianceTimes]);
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, SHOW);
  const label = (st: TodayStatus, start: Date, end: Date) =>
    st === 'live' ? `Live now · ends in ${formatDuration(end.getTime() - now.getTime())}` : st === 'upcoming' ? `Starts in ${formatDuration(start.getTime() - now.getTime())}` : 'Ended';

  return (
    <>
      <SectionHeader title="Today's events" subtitle={`${rows.length} today · times in your time`} right={<Button compact variant="secondary" label="Schedule" onPress={() => router.push('/events')} />} />
      <Card style={{ paddingVertical: space.xs }}>
        {rows.length === 0 ? <Text style={[type.bodySecondary, { paddingVertical: space.sm }]}>No events today.</Text> : null}
        {shown.map((r, i) => (
          <Pressable key={r.ev.id} onPress={() => { haptic(); router.push(`/event/${r.ev.id}`); }}
            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: palette.border, opacity: r.status === 'ended' ? 0.5 : 1 }, pressed && { opacity: 0.7 }]}>
            <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: CAT_COLOR[r.ev.category] }} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '600' }]} numberOfLines={1}>{r.ev.name}</Text>
              <Text style={[type.caption, { color: r.status === 'live' ? palette.success : palette.textSecondary }]}>{label(r.status, r.start, r.end)}</Text>
            </View>
            <Row gap={6}>
              {r.allianceTime ? <Users size={13} color={palette.gold} /> : null}
              {s.alarms[r.ev.id] ? <Bell size={13} color={palette.cyan} /> : null}
              <Text style={[type.numberSmall, { minWidth: 44, textAlign: 'right' }]}>{hhmm(r.start)}</Text>
            </Row>
          </Pressable>
        ))}
        {rows.length > SHOW ? (
          <Pressable onPress={() => setAll(!all)} style={{ paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: palette.border }}>
            <Text style={[type.caption, { color: palette.cyan, textAlign: 'center' }]}>{all ? 'Show less' : `Show all ${rows.length}`}</Text>
          </Pressable>
        ) : null}
      </Card>
    </>
  );
}
