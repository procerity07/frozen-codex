import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import type { GameEvent, Weekday } from '@/types/game';
import { palette, space, type } from '@/theme';
import { Button, Card, Chip, Field, Row, Segmented } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { anchorFor, cleanAllianceTime, currentSlot, plannedStart, timeForWeek, upcomingStarts, type AllianceTime } from '@/lib/allianceTimes';
import { formatDuration } from '@/lib/time';
import { scheduleAllianceEventAlarm } from '@/services/notifications';

const WEEK: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const dayLabel = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]} ${d.getUTCDate()}`; };

/** Oblivion War battle slots (UTC, 1 hour each), as offered in-game. */
const OBLIVION_SLOTS = ['01:00', '12:00', '15:00', '19:00', '21:00'];

const fmtLocal = (d: Date) => `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Lets players enter the start time their alliance chose, optionally alternating between two times week by week. */
export function AllianceTimeCard({ ev }: { ev: GameEvent }) {
  const now = useNow(30_000);
  const s = useAppStore();
  const saved = s.allianceTimes[ev.id];
  const anchors = { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek };
  const [editing, setEditing] = useState(!saved);
  const [time, setTime] = useState(saved?.time ?? '');
  const [alt, setAlt] = useState(saved?.altTime ?? '');
  const [alternate, setAlternate] = useState(!!saved?.altTime);
  const [zone, setZone] = useState<AllianceTime['zone']>(saved?.zone ?? 'utc');
  // Oblivion War: sign-up Wed–Thu, the battle (your slot) is Friday.
  const defaultDays: Weekday[] = ev.id === 'oblivion-war' ? ['Fri'] : ev.days;
  const [days, setDays] = useState<Weekday[]>(saved?.days ?? defaultDays);
  const [date, setDate] = useState<string>(saved?.date ?? '');
  const [dateTime, setDateTime] = useState(saved?.dateTime ?? '');
  const [slot, setSlot] = useState<'A' | 'B'>(saved ? currentSlot(saved, now) : 'A');

  const save = () => {
    const sameDays = days.length === ev.days.length && days.every((d) => ev.days.includes(d));
    const at = cleanAllianceTime({ time, altTime: alternate ? alt : undefined, zone, anchorWeek: anchorFor(now, slot), days: sameDays ? undefined : days, date: date || undefined, dateTime: dateTime || undefined });
    if (!at) { Alert.alert('Check the time', 'Use 24-hour time, for example 19:00.'); return; }
    if (!days.length && !date) { Alert.alert('Pick a day', 'Choose at least one day, or plan a specific date.'); return; }
    if (dateTime && !at.dateTime) { Alert.alert('Check the planned time', 'Use 24-hour time, for example 20:30.'); return; }
    if (alternate && !at.altTime) { Alert.alert('Check the second time', 'Enter a different second time, or turn alternating weeks off.'); return; }
    s.setAllianceTime(ev.id, at);
    if (s.alarms[ev.id]) scheduleAllianceEventAlarm(ev, at, s.alarmLeadMinutes, anchors).catch(() => undefined);
    setEditing(false);
  };

  const next = saved ? upcomingStarts(ev, saved, now, anchors)[0] : undefined;
  const zoneLabel = (z: AllianceTime['zone']) => (z === 'utc' ? 'UTC' : 'your time');

  return (
    <Card style={{ marginTop: space.md }}>
      <Row gap={6}><Users size={15} color={palette.gold} /><Text style={type.heading}>Your alliance's time</Text></Row>
      <Text style={[type.caption, { marginTop: 2 }]}>Each alliance decides when to run this event. Set your alliance's time so alarms and the dashboard match it.</Text>

      {!editing && saved ? (
        <>
          <Text style={[type.body, { marginTop: space.sm }]}>
            {saved.altTime ? `Alternates weekly: ${saved.time} / ${saved.altTime} ${zoneLabel(saved.zone)}. This week: ${timeForWeek(saved, now)}.` : `${saved.time} ${zoneLabel(saved.zone)}`}
          </Text>
          <Text style={[type.caption, { marginTop: 2 }]}>{`Days: ${(saved.days ?? ev.days).join(', ')}${saved.days ? ' (your alliance)' : ''}`}</Text>
          {saved.date ? <Text style={[type.caption, { marginTop: 2, color: palette.gold }]}>{`Planned: ${dayLabel(saved.date)} at ${saved.dateTime ?? saved.time} ${zoneLabel(saved.zone)}${(plannedStart(saved)?.getTime() ?? 0) < now.getTime() ? ' (passed)' : ''}`}</Text> : null}
          {next ? <Text style={[type.numberSmall, { marginTop: 4, color: palette.cyan }]}>Next: {fmtLocal(next)} your time · in {formatDuration(next.getTime() - now.getTime())}</Text> : null}
          <Row style={{ marginTop: space.sm }}>
            <View style={{ flex: 1 }}><Button compact variant="secondary" label="Change" onPress={() => setEditing(true)} /></View>
            <View style={{ flex: 1 }}><Button compact variant="ghost" label="Remove" onPress={() => { s.setAllianceTime(ev.id, null); setTime(''); setAlt(''); setAlternate(false); setDays(defaultDays); setDate(''); setDateTime(''); setEditing(true); }} /></View>
          </Row>
        </>
      ) : ev.id === 'oblivion-war' ? (
        <>
          <Text style={[type.caption, { marginTop: space.sm }]}>Pick the Friday battle slot your alliance signed up for (UTC, 1 hour).</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.xs }}>
            {OBLIVION_SLOTS.map((t) => (
              <Chip key={t} label={`${t}–${String(Number(t.slice(0, 2)) + 1).padStart(2, '0')}:00 UTC`} active={time === t} onPress={() => setTime(t)} />
            ))}
          </View>
          {time ? <Text style={[type.caption, { marginTop: 4 }]}>{`Your time: ${fmtLocal(new Date(Date.UTC(2026, 0, 2, Number(time.slice(0, 2)), 0)))}`}</Text> : null}
          <View style={{ marginTop: space.md }}>
            <Button label="Save slot" onPress={() => {
              if (!OBLIVION_SLOTS.includes(time)) { Alert.alert('Pick a slot', 'Choose one of the battle slots.'); return; }
              const at = cleanAllianceTime({ time, zone: 'utc', anchorWeek: anchorFor(now, 'A'), days: ['Fri'] })!;
              s.setAllianceTime(ev.id, at);
              if (s.alarms[ev.id]) scheduleAllianceEventAlarm(ev, at, s.alarmLeadMinutes, anchors).catch(() => undefined);
              setEditing(false);
            }} />
          </View>
        </>
      ) : (
        <>
          <Row style={{ marginTop: space.sm }}>
            <Field label={alternate ? 'Time A (24-hour)' : 'Time (24-hour)'} value={time} onChangeText={setTime} placeholder="19:00" keyboardType="numbers-and-punctuation" />
            {alternate ? <Field label="Time B" value={alt} onChangeText={setAlt} placeholder="21:00" keyboardType="numbers-and-punctuation" /> : null}
          </Row>
          <View style={{ marginTop: space.sm }}>
            <Segmented options={['utc', 'local'] as const} value={zone} onChange={setZone} labels={{ utc: 'Game time (UTC)', local: 'My time' }} />
          </View>
          <Row style={{ marginTop: space.sm, justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={type.body}>Swaps between two times each week</Text>
              <Text style={type.caption}>For alliances that alternate, e.g. 19:00 one week and 21:00 the next.</Text>
            </View>
            <Switch value={alternate} onValueChange={setAlternate} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
          </Row>
          {alternate ? (
            <View style={{ marginTop: space.sm }}>
              <Text style={type.caption}>Which time is it this week?</Text>
              <View style={{ marginTop: 4 }}>
                <Segmented options={['A', 'B'] as const} value={slot} onChange={setSlot} labels={{ A: `Time A${time ? ` (${time})` : ''}`, B: `Time B${alt ? ` (${alt})` : ''}` }} />
              </View>
            </View>
          ) : null}
          <Text style={[type.caption, { marginTop: space.md }]}>{`Days you run it (game days, UTC). Usual: ${ev.days.join(', ')}`}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {WEEK.map((d) => <Chip key={d} label={d} active={days.includes(d)} onPress={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} />)}
          </View>
          <Text style={[type.caption, { marginTop: space.md }]}>Plan a specific date (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <Chip label="None" active={!date} onPress={() => setDate('')} />
            {Array.from({ length: 14 }, (_, i) => isoDay(new Date(now.getTime() + i * 86_400_000))).map((iso) => (
              <Chip key={iso} label={dayLabel(iso)} active={date === iso} onPress={() => setDate(iso)} />
            ))}
          </View>
          {date ? (
            <View style={{ marginTop: space.sm }}>
              <Field label={`Time on ${dayLabel(date)} (blank = ${time || 'usual time'})`} value={dateTime} onChangeText={setDateTime} placeholder={time || '20:30'} keyboardType="numbers-and-punctuation" />
              <Text style={type.caption}>Replaces the usual run on that day. Alarms follow it.</Text>
            </View>
          ) : null}
          <View style={{ marginTop: space.md }}><Button label="Save alliance time" onPress={save} /></View>
        </>
      )}
    </Card>
  );
}
