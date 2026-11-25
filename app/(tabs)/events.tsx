import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, BellOff, Brain, Calculator, ChevronDown, ChevronRight, Search, Swords } from 'lucide-react-native';
import type { EventCategory, GameEvent } from '@/types/game';
import { listEvents } from '@/db/repo';
import { eventCurrencies, events as seedEvents, royalArmsRace } from '@/data/seed';
import { palette, radius, space, type } from '@/theme';
import { Badge, Button, Card, Chip, ChipRow, EmptyState, Field, IconButton, Row, Screen, SectionHeader, Segmented } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { localOffsetLabel, utcToLocalLabel, utcWeekStart, WEEKDAYS } from '@/lib/time';
import { twoWeekCalendar } from '@/lib/schedule';
import { doubleDipPlan } from '@/lib/planner';
import { cancelEventAlarm, ensurePermission, scheduleEventAlarm } from '@/services/notifications';

const VIEWS = ['Calendar', 'Registry', 'Planner', 'Expiry'] as const;
const CATS: EventCategory[] = ['Core Cycle', 'Weekly', 'Alliance', 'Cross-Realm War', 'Mini-Game', 'Recruitment & Seasonal'];

export default function EventsScreen() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Calendar');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm }}>
        <Segmented options={VIEWS} value={view} onChange={setView} />
        <Row>
          <View style={{ flex: 1 }}><Button compact variant="secondary" icon={Brain} label="Sophia" onPress={() => router.push('/tools/sophia')} /></View>
          <View style={{ flex: 1 }}><Button compact variant="secondary" icon={Calculator} label="Bag Hoard" onPress={() => router.push('/tools/bag')} /></View>
          <View style={{ flex: 1 }}><Button compact variant="secondary" icon={Swords} label="War Room" onPress={() => router.push('/tools/war-room')} /></View>
        </Row>
      </View>
      {view === 'Calendar' ? <CalendarView /> : view === 'Registry' ? <Registry /> : view === 'Planner' ? <Planner /> : <ExpiryMatrix />}
    </View>
  );
}

function CalendarView() {
  const now = useNow(60_000);
  const a = useAppStore((s) => s.aceLordAnchorWeek);
  const r = useAppStore((s) => s.rotationAnchorWeek);
  const days = useMemo(() => twoWeekCalendar(utcWeekStart(now), seedEvents, { aceLordAnchorWeek: a, rotationAnchorWeek: r }), [now, a, r]);
  const todayKey = now.toISOString().slice(0, 10);
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  return (
    <Screen>
      <Text style={[type.caption, { marginBottom: space.sm }]}>Times in UTC · your device is {localOffsetLabel(now)}</Text>
      {days.map((d, i) => {
        const key = d.date.toISOString().slice(0, 10);
        const isToday = key === todayKey;
        const firstOfWeek = i % 7 === 0;
        return (
          <View key={key}>
            {firstOfWeek ? (
              <SectionHeader title={`${d.cycle} Week`} subtitle={`Rotation week ${d.rotation} of 4 · ${d.cycle === 'Ace Lord' ? 'Conquest of Lords Saturday' : 'Realm Expedition Saturday'}`} />
            ) : null}
            <Card style={[{ marginBottom: space.sm, padding: space.md }, isToday && { borderColor: palette.cyan }]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: toggled[key] ?? isToday }} onPress={() => setToggled({ ...toggled, [key]: !(toggled[key] ?? isToday) })}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={type.heading}>{WEEKDAYS[i % 7]} · {key.slice(5)}</Text>
                  <Row gap={8}>
                    {isToday ? <Badge label="Today" color={palette.cyan} /> : null}
                    {(toggled[key] ?? isToday) ? null : <Text style={type.caption}>{`${d.events.filter((e) => e.category !== 'Core Cycle').length} events`}</Text>}
                    {(toggled[key] ?? isToday) ? <ChevronDown size={18} color={palette.textSecondary} /> : <ChevronRight size={18} color={palette.textSecondary} />}
                  </Row>
                </Row>
              </Pressable>
              {(toggled[key] ?? isToday) ? <>
              {d.themes.map((t) => <Text key={t.label} style={[type.bodySecondary, { marginTop: 2 }]}><Text style={{ color: palette.gold }}>{t.label}:</Text> {t.theme}</Text>)}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
                {d.events.filter((e) => e.category !== 'Core Cycle').map((e) => (
                  <Pressable key={e.id} onPress={() => router.push(`/event/${e.id}`)} style={st.evChip}>
                    <Text style={st.evChipText}>{e.name}{e.startUtc !== '00:00' ? ` ${e.startUtc}` : ''}</Text>
                  </Pressable>
                ))}
              </View>
              </> : null}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

function Registry() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<EventCategory | null>(null);
  const [rows, setRows] = useState<GameEvent[]>([]);
  const alarms = useAppStore((s) => s.alarms);
  const setAlarm = useAppStore((s) => s.setAlarm);
  const lead = useAppStore((s) => s.alarmLeadMinutes);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => { listEvents(q.trim() || undefined).then((r) => alive && setRows(r)).catch(() => alive && setRows([])); }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const data = cat ? rows.filter((e) => e.category === cat) : rows;

  const toggleAlarm = async (e: GameEvent) => {
    const on = !alarms[e.id];
    if (on) {
      if (!(await ensurePermission())) return;
      await scheduleEventAlarm(e, lead);
    } else {
      await cancelEventAlarm(e.id);
    }
    setAlarm(e.id, on);
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(e) => e.id}
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={{ backgroundColor: palette.bg }}>
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
            <Row><Search size={16} color={palette.textMuted} /><Field placeholder={`Search ${rows.length} events, rules, rewards`} value={q} onChangeText={setQ} autoCorrect={false} /></Row>
          </View>
          <ChipRow>
            <Chip label="All" active={!cat} onPress={() => setCat(null)} />
            {CATS.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
          </ChipRow>
        </View>
      }
      renderItem={({ item: e }) => (
        <View style={{ paddingHorizontal: space.lg }}>
          <Pressable onPress={() => router.push(`/event/${e.id}`)} style={({ pressed }) => [st.row, pressed && { opacity: 0.8 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={type.heading} numberOfLines={1}>{e.name}</Text>
              <Text style={type.caption} numberOfLines={1}>{e.cadence}</Text>
              <Text style={type.bodySecondary} numberOfLines={2}>{e.summary}</Text>
            </View>
            {e.days.length ? (
              <IconButton icon={alarms[e.id] ? Bell : BellOff} active={!!alarms[e.id]} label={`Toggle alarm for ${e.name}`} onPress={() => { toggleAlarm(e).catch(() => undefined); }} />
            ) : <Badge label="Random" />}
          </Pressable>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No events found" />}
    />
  );
}

function Planner() {
  const plan = useMemo(doubleDipPlan, []);
  const now = useNow(60_000);
  const todayWd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getUTCDay()] ?? 'Mon';
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  return (
    <Screen>
      <SectionHeader title="Ace Lord week planner" subtitle="Daily theme, side events and Royal Arms Race" />
      {plan.map((d) => (
        <Card key={d.weekday} style={{ marginBottom: space.sm, padding: space.md }} accent={d.shared.length ? palette.success : undefined}>
          <Pressable accessibilityRole="button" onPress={() => setOpenDays({ ...openDays, [d.weekday]: !(openDays[d.weekday] ?? d.weekday.startsWith(todayWd)) })}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={type.heading}>{d.weekday}</Text>
              <Row gap={8}>
                {d.shared.length ? <Badge label="Double-dip" color={palette.success} /> : null}
                {(openDays[d.weekday] ?? d.weekday.startsWith(todayWd)) ? <ChevronDown size={18} color={palette.textSecondary} /> : <ChevronRight size={18} color={palette.textSecondary} />}
              </Row>
            </Row>
          </Pressable>
          {(openDays[d.weekday] ?? d.weekday.startsWith(todayWd)) ? <>
          <Row style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}><Text style={[type.caption, { color: palette.gold }]}>Ace Lord</Text><Text style={type.body}>{d.aceLord}</Text></View>
            <View style={{ flex: 1 }}><Text style={[type.caption, { color: palette.cyan }]}>Daily event</Text><Text style={type.body}>{d.allianceDuel}</Text></View>
          </Row>
          {d.royal.length ? <Text style={[type.caption, { marginTop: space.sm }]}>Royal Arms Race: {d.royal.map((r) => `${r.utc} ${r.theme}`).join(' · ')}</Text> : null}
          <Text style={[type.bodySecondary, { marginTop: space.sm }]}>{d.advice}</Text>
          </> : null}
        </Card>
      ))}
      <SectionHeader title="Royal Arms Race slots" subtitle={`Thu–Sun · local ${localOffsetLabel(now)}`} />
      {royalArmsRace.map((s) => (
        <Card key={s.slot} style={{ marginBottom: space.sm, padding: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>Slot {s.slot}</Text>
            <Text style={type.number}>{s.utc} UTC</Text>
          </Row>
          <Text style={type.caption}>Local start: {utcToLocalLabel('Thu', s.utc.slice(0, 5), now)}</Text>
          <Text style={[type.bodySecondary, { marginTop: 2 }]}>Random each day from: {s.themes.join(' · ')}</Text>
        </Card>
      ))}
    </Screen>
  );
}

function ExpiryMatrix() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'save' | 'spend'>('all');
  const rows = eventCurrencies.filter((c) => (filter === 'all' || (filter === 'save' ? !c.expires : c.expires)) && (`${c.name} ${c.eventId}`).toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen>
      <View style={{ marginTop: space.sm, gap: space.sm }}>
        <Row><Search size={16} color={palette.textMuted} /><Field placeholder="Search currencies" value={q} onChangeText={setQ} /></Row>
        <Segmented options={['all', 'save', 'spend'] as const} value={filter} onChange={setFilter} labels={{ all: 'All', save: 'Safe to save', spend: 'Expires' }} />
      </View>
      <View style={{ marginTop: space.md }}>
        {rows.map((c) => (
          <Card key={c.id} style={{ marginBottom: space.sm, padding: space.md }} accent={c.expires ? palette.danger : palette.success}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[type.heading, { flex: 1 }]}>{c.name}</Text>
              <Badge label={c.expires ? 'Expires' : 'Keeps'} color={c.expires ? palette.danger : palette.success} />
            </Row>
            <Pressable onPress={() => router.push(`/event/${c.eventId}`)}><Text style={[type.caption, { color: palette.cyan, marginTop: 2 }]}>{seedEvents.find((e) => e.id === c.eventId)?.name ?? c.eventId}</Text></Pressable>
            <Text style={[type.bodySecondary, { marginTop: 4 }]}>{c.guidance}</Text>
            {c.salvage ? <Text style={[type.caption, { marginTop: 2 }]}>Salvage: {c.salvage}</Text> : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  evChip: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: palette.bg },
  evChipText: { fontSize: 12, fontWeight: '600', color: palette.textSecondary, fontVariant: ['tabular-nums'] },
});
