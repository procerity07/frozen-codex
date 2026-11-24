import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import type { GameEvent } from '@/types/game';
import { palette, space, type } from '@/theme';
import { Button, Card, Field, Row, Segmented } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { anchorFor, cleanAllianceTime, currentSlot, timeForWeek, upcomingStarts, type AllianceTime } from '@/lib/allianceTimes';
import { formatDuration } from '@/lib/time';
import { scheduleAllianceEventAlarm } from '@/services/notifications';

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
  const [slot, setSlot] = useState<'A' | 'B'>(saved ? currentSlot(saved, now) : 'A');

  const save = () => {
    const at = cleanAllianceTime({ time, altTime: alternate ? alt : undefined, zone, anchorWeek: anchorFor(now, slot) });
    if (!at) { Alert.alert('Check the time', 'Use 24-hour time, for example 19:00.'); return; }
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
          {next ? <Text style={[type.numberSmall, { marginTop: 4, color: palette.cyan }]}>Next: {fmtLocal(next)} your time · in {formatDuration(next.getTime() - now.getTime())}</Text> : null}
          <Row style={{ marginTop: space.sm }}>
            <View style={{ flex: 1 }}><Button compact variant="secondary" label="Change" onPress={() => setEditing(true)} /></View>
            <View style={{ flex: 1 }}><Button compact variant="ghost" label="Remove" onPress={() => { s.setAllianceTime(ev.id, null); setTime(''); setAlt(''); setAlternate(false); setEditing(true); }} /></View>
          </Row>
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
          <View style={{ marginTop: space.md }}><Button label="Save alliance time" onPress={save} /></View>
        </>
      )}
    </Card>
  );
}
