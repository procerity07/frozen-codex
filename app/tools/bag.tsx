import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import type { BagDayKey, BagItem } from '@/types/game';
import { aceCards, aceLordPhases, armsRacePhases, bagDayLabels, bagItems, radiantCards } from '@/data/seed';
import { elementColors, palette, space, type } from '@/theme';
import { Accordion, Badge, Button, Card, Chip, ChipRow, ConfidenceNote, NumberField, ProgressBar, ProgressRing, Row, Screen, SectionHeader, Table } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { bagPoints, fmt, fmtFull, phaseProgress } from '@/lib/calculators';

const DAY_KEYS = Object.keys(bagDayLabels) as BagDayKey[];
const GROUPS: BagItem['group'][] = ['Shards', 'Scrolls', 'Bond', 'AP & Stamina', 'Speedups', 'Dragon', 'Curio', 'Essences'];

export default function BagHoard() {
  const inv = useAppStore((s) => s.bagInventory);
  const setQty = useAppStore((s) => s.setBagQty);
  const reset = useAppStore((s) => s.resetBag);
  const ageWeeks = useAppStore((s) => s.realm.ageWeeks);
  const [day, setDay] = useState<BagDayKey>('AL1');
  const [earned, setEarned] = useState(0);

  const result = useMemo(() => bagPoints(bagItems, inv, day), [inv, day]);
  const dayVerified = bagItems.filter((i) => i.points[day]).every((i) => i.verifiedDays?.includes(day));
  const perDay = useMemo(() => DAY_KEYS.map((k) => ({ key: k, total: bagPoints(bagItems, inv, k).total })), [inv]);
  const isAL = day.startsWith('AL');
  const isAR = day.startsWith('AR');
  const phases = isAL ? aceLordPhases : armsRacePhases;
  const progress = phaseProgress(earned + result.total, phases);
  const cards = (isAL ? radiantCards : aceCards).filter((c) => ageWeeks >= c.minWeeks);
  const card = cards[cards.length - 1];

  return (
    <Screen sticky={<View style={{ backgroundColor: palette.bg }}><ChipRow>{DAY_KEYS.map((k) => <Chip key={k} label={k} active={k === day} onPress={() => setDay(k)} color={k.startsWith('AL') ? palette.gold : k.startsWith('AR') ? palette.cyan : elementColors.Dark} />)}</ChipRow></View>}>
      <Stack.Screen options={{ title: 'Bag Hoard Calculator' }} />
      <Card>
        <Text style={type.caption}>{bagDayLabels[day]}</Text>
        <Row style={{ marginTop: space.sm, justifyContent: 'space-between' }}>
          <View>
            <Text style={type.caption}>Points from your bag</Text>
            <Text style={[type.numberLarge, { color: palette.cyan }]}>{fmtFull(result.total)}</Text>
          </View>
          {isAL || isAR ? <ProgressRing ratio={progress.ratio} label={`${Math.round(progress.ratio * 100)}%`} sub={`Phase ${progress.reached.length}/6`} color={isAL ? palette.gold : palette.cyan} /> : null}
        </Row>
        {isAL || isAR ? (
          <>
            <View style={{ marginTop: space.md }}><NumberField label="Points already earned this cycle" value={earned} onChange={setEarned} /></View>
            <Text style={[type.bodySecondary, { marginTop: space.sm }]}>
              {progress.next ? `${fmtFull(progress.remaining)} pts to Phase ${progress.next.phase}: ${progress.next.reward}` : 'All 6 phases reached.'}
            </Text>
            {card ? <Text style={[type.caption, { marginTop: 4, color: palette.gold }]}>Realm age {ageWeeks}w → {card.card}: {card.heroes.join(', ')}</Text> : null}
          </>
        ) : null}
      </Card>

      {isAL || isAR ? (
        <>
          <SectionHeader title={isAL ? 'Ace Lord phases' : 'Arms Race phases'} />
          <Card>
            {phases.map((p) => {
              const total = earned + result.total;
              return (
                <View key={p.phase} style={{ marginBottom: space.sm }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={type.body}>Phase {p.phase} · {p.reward}</Text>
                    <Text style={type.numberSmall}>{fmt(p.points)}</Text>
                  </Row>
                  <View style={{ marginTop: 4 }}><ProgressBar ratio={total / p.points} color={total >= p.points ? palette.success : palette.cyan} /></View>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {result.lines.length ? (
        <>
          <SectionHeader title="Breakdown" />
          <Table rows={result.lines} columns={[
            { key: 'i', title: 'Item', flex: 2, render: (l) => l.item.label },
            { key: 'q', title: 'Qty', align: 'right', render: (l) => fmtFull(l.qty) },
            { key: 'p', title: 'Points', align: 'right', render: (l) => fmtFull(l.points) },
          ]} />
        </>
      ) : null}

      <SectionHeader title="Your saved items" right={<Button compact variant="ghost" icon={RotateCcw} label="Reset" onPress={reset} />} />
      {GROUPS.map((g) => {
        const items = bagItems.filter((i) => i.group === g);
        const scoring = items.filter((i) => i.points[day]).length;
        return (
          <Accordion key={g} title={g} subtitle={`${scoring}/${items.length} score on ${day}`} initiallyOpen={g === 'Shards'}>
            {items.map((i) => (
              <Row key={i.id} style={{ marginBottom: space.sm, opacity: i.points[day] ? 1 : 0.55 }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{i.label}</Text>
                  <Text style={type.caption}>{i.points[day] ? `${fmtFull(i.points[day]!)} pts / ${i.unit}${i.verifiedDays?.includes(day) ? ' · in-game' : ''}` : 'No points today'}</Text>
                </View>
                <NumberField value={inv[i.id] ?? 0} onChange={(n) => setQty(i.id, n)} width={110} />
              </Row>
            ))}
          </Accordion>
        );
      })}

      <SectionHeader title="Best day for your bag" />
      <Card>
        {[...perDay].sort((a, b) => b.total - a.total).slice(0, 8).map((d) => (
          <Row key={d.key} style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[type.body, { flex: 1 }]} numberOfLines={1}>{bagDayLabels[d.key]}</Text>
            <Badge label={fmtFull(d.total)} color={d.key === day ? palette.cyan : palette.textSecondary} />
          </Row>
        ))}
      </Card>
      {dayVerified ? (
        <Text style={[type.caption, { marginTop: space.sm, color: palette.success }]}>Point values for this day were confirmed in-game.</Text>
      ) : (
        <ConfidenceNote confidence="estimate" />
      )}
    </Screen>
  );
}
