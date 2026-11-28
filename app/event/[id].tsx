import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Bell, BellOff, Coins, Gift, Lightbulb, ScrollText } from 'lucide-react-native';
import type { GameEvent } from '@/types/game';
import { getEvent } from '@/db/repo';
import { cycleDays, eventCurrencies, heroes } from '@/data/seed';
import { palette, space, type } from '@/theme';
import { Badge, Button, Card, Chip, ChipRow, CollapsibleSection, ConfidenceNote, EmptyState, Row, Screen, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { utcToLocalLabel } from '@/lib/time';
import { cancelEventAlarm, ensurePermission, scheduleAllianceEventAlarm, scheduleEventAlarm } from '@/services/notifications';
import { isAllianceTimed } from '@/lib/allianceTimes';
import { AllianceTimeCard } from '@/components/domain/AllianceTimeCard';
import { AceLordView } from '@/components/domain/AceLordView';
import { EventHeader } from '@/components/domain/EventHeader';
import { cleanSourceNotes } from '@/lib/text';

/** Rules shown before "Show all". */
const RULES_SHOWN = 4;

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<GameEvent | null | undefined>(undefined);
  const [allRules, setAllRules] = useState(false);
  const alarmOn = useAppStore((s) => !!s.alarms[String(id)]);
  const setAlarm = useAppStore((s) => s.setAlarm);
  const lead = useAppStore((s) => s.alarmLeadMinutes);
  const allianceTime = useAppStore((s) => s.allianceTimes[String(id)]);
  const aceAnchor = useAppStore((s) => s.aceLordAnchorWeek);
  const rotAnchor = useAppStore((s) => s.rotationAnchorWeek);
  useEffect(() => { getEvent(String(id)).then(setEv).catch(() => setEv(null)); }, [id]);

  if (ev === undefined) return <Screen><Stack.Screen options={{ title: '' }} /></Screen>;
  if (!ev) return <Screen><Stack.Screen options={{ title: 'Not found' }} /><EmptyState title="Event not found" /></Screen>;

  const days = cycleDays.find((c) => c.eventId === ev.id)?.days;
  const currencies = eventCurrencies.filter((c) => c.eventId === ev.id);
  const featured = heroes.filter((h) => ev.featuredHeroes.includes(h.id));

  const toggle = async () => {
    if (!alarmOn) {
      if (!(await ensurePermission())) return;
      if (allianceTime) await scheduleAllianceEventAlarm(ev, allianceTime, lead, { aceLordAnchorWeek: aceAnchor, rotationAnchorWeek: rotAnchor });
      else await scheduleEventAlarm(ev, lead);
    } else await cancelEventAlarm(ev.id);
    setAlarm(ev.id, !alarmOn);
  };

  const isAce = ev.id === 'ace-lord';
  // Split the rules like the game's tabs: how to earn points, rewards, and the remaining rules.
  const isReward = (r: string) => /\b(rewards?|phase|rank|grade|trophy|trophies|tiers?|realm quests)\b/i.test(r) && /\d/.test(r);
  const isEarn = (r: string) => !isReward(r) && /\b(points?|pts|score)\b/i.test(r) && /\d/.test(r);
  const rules = ev.rules.map(cleanSourceNotes);
  const earn = rules.filter(isEarn);
  const rewardRules = rules.filter(isReward);
  const plain = rules.filter((r) => !isEarn(r) && !isReward(r));
  const infoCard = (
      <Card style={{ marginTop: space.sm }}>
        <Row style={{ flexWrap: 'wrap' }}>
          <Badge label={ev.category} color={palette.cyan} />
          <Badge label={ev.cycleWeek === 'Both' ? 'Every week' : ev.cycleWeek === 'Random' ? 'Random' : `${ev.cycleWeek} Week`} color={palette.gold} />
          {ev.rotationWeek ? <Badge label={`Rotation wk ${ev.rotationWeek}`} /> : null}
        </Row>
        <Text style={[type.body, { marginTop: space.md }]}>{ev.summary}</Text>
        <Text style={[type.caption, { marginTop: space.sm }]}>{ev.cadence}</Text>
        {ev.rewards.length ? <Text style={[type.caption, { marginTop: 4, color: palette.gold }]}>{`Rewards: ${ev.rewards.slice(0, 3).join(' · ')}${ev.rewards.length > 3 ? ' …' : ''}`}</Text> : null}
        {ev.days.length ? (
          <>
            <View style={{ marginTop: space.md, gap: 4 }}>
              {isAllianceTimed(ev.id) ? (
                <Text style={type.body}>{ev.days.join(', ')} · time set by your alliance</Text>
              ) : ev.days.map((d) => (
                <Row key={d} style={{ justifyContent: 'space-between' }}>
                  <Text style={type.body}>{d} {ev.startUtc} UTC</Text>
                  <Text style={type.numberSmall}>Local {utcToLocalLabel(d, ev.startUtc)}</Text>
                </Row>
              ))}
            </View>
            <View style={{ marginTop: space.md }}>
              {isAllianceTimed(ev.id) && !allianceTime ? (
                <Text style={type.caption}>Set your alliance's time below to turn on an alarm.</Text>
              ) : (
                <Button variant={alarmOn ? 'secondary' : 'primary'} icon={alarmOn ? BellOff : Bell} label={alarmOn ? 'Alarm on — tap to cancel' : `Alarm ${lead} min before`} onPress={() => { toggle().catch(() => undefined); }} />
              )}
            </View>
          </>
        ) : null}
        <ConfidenceNote confidence={ev.confidence} />
      </Card>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: ev.name }} />
      {isAce ? <AceLordView /> : (
        <EventHeader ev={ev} alarmOn={alarmOn} onAlarm={() => { toggle().catch(() => undefined); }}
          alarmLabel={alarmOn ? 'Alarm on, tap to cancel' : `Alarm ${lead} min before`}
          canAlarm={ev.days.length > 0 && !(isAllianceTimed(ev.id) && !allianceTime)} />
      )}
      {isAllianceTimed(ev.id) ? <AllianceTimeCard ev={ev} /> : null}

      {days && !isAce ? (
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

      {earn.length ? (
        <>
          <SectionHeader title="How to earn points" icon={Coins} />
          <Card style={{ paddingVertical: space.xs }}>{earn.map((r, i) => <Text key={i} style={[type.body, { paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: palette.border }]}>{r}</Text>)}</Card>
        </>
      ) : null}
      {rewardRules.length ? (
        <>
          <SectionHeader title="Rewards" icon={Gift} />
          {rewardRules.map((r, i) => <Card key={i} style={{ marginBottom: space.xs, padding: space.md }} accent={palette.gold}><Text style={type.body}>{r}</Text></Card>)}
        </>
      ) : null}
      {plain.length ? (
        <>
          <SectionHeader title="Rules" icon={ScrollText} subtitle={plain.length > RULES_SHOWN ? `${plain.length} rules` : undefined} />
          <Card>
            {(allRules ? plain : plain.slice(0, RULES_SHOWN)).map((r, i) => <Text key={i} style={[type.body, { marginBottom: 6 }]}>{'•'} {r}</Text>)}
            {plain.length > RULES_SHOWN ? (
              <Pressable onPress={() => setAllRules(!allRules)} accessibilityRole="button"><Text style={[type.caption, { color: palette.cyan }]}>{allRules ? 'Show fewer' : `Show all ${plain.length} rules`}</Text></Pressable>
            ) : null}
          </Card>
        </>
      ) : null}

      {ev.rewards.length && !rewardRules.length ? (<CollapsibleSection title="Key rewards" icon={Gift} initiallyOpen={false}><Card>{ev.rewards.map((r, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{'•'} {r}</Text>)}</Card></CollapsibleSection>) : null}
      {ev.tips.length ? (<CollapsibleSection title="Tips" icon={Lightbulb} initiallyOpen={false}><Card accent={palette.gold}>{ev.tips.map((r, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{r}</Text>)}</Card></CollapsibleSection>) : null}

      {currencies.length ? (
        <>
          <CollapsibleSection title="Event currencies" icon={Coins} initiallyOpen={false}>
          {currencies.map((c) => (
            <Card key={c.id} style={{ marginBottom: space.sm, padding: space.md }} accent={c.expires ? palette.danger : palette.success}>
              <Row style={{ justifyContent: 'space-between' }}><Text style={type.heading}>{c.name}</Text><Badge label={c.expires ? 'Expires' : 'Keeps'} color={c.expires ? palette.danger : palette.success} /></Row>
              <Text style={type.bodySecondary}>{c.guidance}</Text>
            </Card>
          ))}
          </CollapsibleSection>
        </>
      ) : null}

      {featured.length ? (
        <>
          <SectionHeader title="Featured heroes" />
          <ChipRow>{featured.map((h) => <Chip key={h.id} label={h.name} onPress={() => router.push(`/hero/${h.id}`)} />)}</ChipRow>
        </>
      ) : null}
      <CollapsibleSection title={isAce ? 'Event info & alarm' : 'About & schedule'} subtitle="Description, days and times" initiallyOpen={false}>{infoCard}</CollapsibleSection>
    </Screen>
  );
}
