import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Bell, BellOff, Coins, Gift, Lightbulb, ScrollText } from 'lucide-react-native';
import type { GameEvent } from '@/types/game';
import { getEvent } from '@/db/repo';
import { cycleDays, eventCurrencies, heroes } from '@/data/seed';
import { palette, space, type } from '@/theme';
import { Badge, Button, Card, Chip, ChipRow, ConfidenceNote, EmptyState, Row, Screen, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { utcToLocalLabel } from '@/lib/time';
import { cancelEventAlarm, ensurePermission, scheduleEventAlarm } from '@/services/notifications';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<GameEvent | null | undefined>(undefined);
  const alarmOn = useAppStore((s) => !!s.alarms[String(id)]);
  const setAlarm = useAppStore((s) => s.setAlarm);
  const lead = useAppStore((s) => s.alarmLeadMinutes);
  useEffect(() => { getEvent(String(id)).then(setEv).catch(() => setEv(null)); }, [id]);

  if (ev === undefined) return <Screen><Stack.Screen options={{ title: '' }} /></Screen>;
  if (!ev) return <Screen><Stack.Screen options={{ title: 'Not found' }} /><EmptyState title="Event not found" /></Screen>;

  const days = cycleDays.find((c) => c.eventId === ev.id)?.days;
  const currencies = eventCurrencies.filter((c) => c.eventId === ev.id);
  const featured = heroes.filter((h) => ev.featuredHeroes.includes(h.id));

  const toggle = async () => {
    if (!alarmOn) {
      if (!(await ensurePermission())) return;
      await scheduleEventAlarm(ev, lead);
    } else await cancelEventAlarm(ev.id);
    setAlarm(ev.id, !alarmOn);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: ev.name }} />
      <Card style={{ marginTop: space.sm }}>
        <Row style={{ flexWrap: 'wrap' }}>
          <Badge label={ev.category} color={palette.cyan} />
          <Badge label={ev.cycleWeek === 'Both' ? 'Every week' : ev.cycleWeek === 'Random' ? 'Random' : `${ev.cycleWeek} Week`} color={palette.gold} />
          {ev.rotationWeek ? <Badge label={`Rotation wk ${ev.rotationWeek}`} /> : null}
        </Row>
        <Text style={[type.body, { marginTop: space.md }]}>{ev.summary}</Text>
        <Text style={[type.caption, { marginTop: space.sm }]}>{ev.cadence}</Text>
        {ev.days.length ? (
          <>
            <View style={{ marginTop: space.md, gap: 4 }}>
              {ev.days.map((d) => (
                <Row key={d} style={{ justifyContent: 'space-between' }}>
                  <Text style={type.body}>{d} {ev.startUtc} UTC</Text>
                  <Text style={type.numberSmall}>Local {utcToLocalLabel(d, ev.startUtc)}</Text>
                </Row>
              ))}
            </View>
            <View style={{ marginTop: space.md }}>
              <Button variant={alarmOn ? 'secondary' : 'primary'} icon={alarmOn ? BellOff : Bell} label={alarmOn ? 'Alarm on — tap to cancel' : `Alarm ${lead} min before`} onPress={() => { toggle().catch(() => undefined); }} />
            </View>
          </>
        ) : null}
        <ConfidenceNote confidence={ev.confidence} />
      </Card>

      {days ? (
        <>
          <SectionHeader title="Daily themes" />
          {days.map((d) => (
            <Card key={d.day} style={{ marginBottom: space.sm, padding: space.md }}>
              <Row style={{ justifyContent: 'space-between' }}><Text style={type.heading}>Day {d.day} · {d.theme}</Text><Text style={type.caption}>{d.weekday}</Text></Row>
              <Text style={[type.caption, { marginTop: 2 }]}>{d.scoring.join(' · ')}</Text>
            </Card>
          ))}
        </>
      ) : null}

      <SectionHeader title="Rules" icon={ScrollText} />
      <Card>{ev.rules.map((r, i) => <Text key={i} style={[type.body, { marginBottom: 6 }]}>{'•'} {r}</Text>)}</Card>

      {ev.rewards.length ? (<><SectionHeader title="Key rewards" icon={Gift} /><Card>{ev.rewards.map((r, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{'•'} {r}</Text>)}</Card></>) : null}
      {ev.tips.length ? (<><SectionHeader title="Optimization tips" icon={Lightbulb} /><Card accent={palette.gold}>{ev.tips.map((r, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{r}</Text>)}</Card></>) : null}

      {currencies.length ? (
        <>
          <SectionHeader title="Event currencies" icon={Coins} />
          {currencies.map((c) => (
            <Card key={c.id} style={{ marginBottom: space.sm, padding: space.md }} accent={c.expires ? palette.danger : palette.success}>
              <Row style={{ justifyContent: 'space-between' }}><Text style={type.heading}>{c.name}</Text><Badge label={c.expires ? 'Expires' : 'Keeps'} color={c.expires ? palette.danger : palette.success} /></Row>
              <Text style={type.bodySecondary}>{c.guidance}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {featured.length ? (
        <>
          <SectionHeader title="Featured heroes" />
          <ChipRow>{featured.map((h) => <Chip key={h.id} label={h.name} onPress={() => router.push(`/hero/${h.id}`)} />)}</ChipRow>
        </>
      ) : null}
    </Screen>
  );
}
