import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { citadelLevels, heroes } from '@/data/seed';
import { palette, space, type } from '@/theme';
import { Button, Card, ConfidenceNote, NumberField, Row, Screen, SectionHeader, Stat, Table } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { civilBonuses } from '@/lib/roster';
import { fmt, fmtFull, planCitadel, RESOURCE_KEYS, type ResourceKey } from '@/lib/calculators';
import { formatDurationShort } from '@/lib/time';

const LABEL: Record<ResourceKey, string> = { food: 'Food', wood: 'Wood', stone: 'Stone', iron: 'Iron', ancientTome: 'Ancient Tome', astronomyTome: 'Astronomy Tome', gloryCodex: 'Glory Codex', goldStatue: 'Gold Statue' };

export default function CitadelPlanner() {
  const c = useAppStore((s) => s.citadel);
  const set = useAppStore((s) => s.setCitadel);
  const from = Math.min(Math.max(0, c.from), 39);
  const to = Math.min(Math.max(from + 1, c.to), 40);
  const plan = planCitadel(citadelLevels, from, to, c.owned, c.bonuses);
  const b = c.bonuses;
  const roster = useAppStore((s) => s.roster);
  const buildBonuses = civilBonuses(heroes, roster).filter((x) => x.stat === 'buildSpeed' || x.stat === 'buildCost');
  const knownSpeed = buildBonuses.filter((x) => x.stat === 'buildSpeed' && x.active && x.value !== null).reduce((t, x) => t + x.value!, 0);
  const setB = (k: keyof typeof b, v: number) => set({ bonuses: { ...b, [k]: v } });

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Citadel Planner' }} />
      <Card style={{ marginTop: space.sm }}>
        <Row>
          <NumberField label="Current Citadel" value={c.from} onChange={(n) => set({ from: n })} />
          <NumberField label="Target Citadel" value={c.to} onChange={(n) => set({ to: n })} />
        </Row>
        <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
          <Stat label="Base build time" value={formatDurationShort(plan.baseSeconds)} />
          <Stat label="Net build time" value={formatDurationShort(plan.netSeconds)} color={palette.cyan} align="right" />
        </Row>
        {plan.unknownTimeLevels.length ? (
          <Text style={[type.caption, { marginTop: space.sm, color: palette.gold }]}>
            Build time unknown for Citadel {plan.unknownTimeLevels.join(', ')} — not included in these totals.
          </Text>
        ) : null}
      </Card>

      <SectionHeader title="Speed & cost bonuses" subtitle="Civil heroes, Builder gear, VIP, Institute" />
      <Card>
        <Row><NumberField label="Civil hero speed" value={b.civilSpeedPct} onChange={(n) => setB('civilSpeedPct', n)} suffix="%" /><NumberField label="Builder gear" value={b.builderGearPct} onChange={(n) => setB('builderGearPct', n)} suffix="%" /></Row>
        <Row style={{ marginTop: space.sm }}><NumberField label="VIP" value={b.vipPct} onChange={(n) => setB('vipPct', n)} suffix="%" /><NumberField label="Institute" value={b.institutePct} onChange={(n) => setB('institutePct', n)} suffix="%" /></Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Cost reduction (William, Chloe, Dragon's Lair)" value={b.costReductionPct} onChange={(n) => setB('costReductionPct', Math.min(n, 90))} suffix="%" /></View>
        {buildBonuses.length ? (
          <View style={{ marginTop: space.md, gap: 4 }}>
            <Text style={type.caption}>From My Heroes</Text>
            {buildBonuses.map((x) => (
              <Text key={`${x.heroId}-${x.skill}`} style={type.bodySecondary}>
                {x.hero}: {x.skill} {x.active && x.value !== null ? `+${x.value}%` : `(${x.note.toLowerCase()})`}
              </Text>
            ))}
            {knownSpeed ? (
              <View style={{ marginTop: space.sm }}>
                <Button compact variant="secondary" label={`Use +${knownSpeed}% civil hero speed`} onPress={() => setB('civilSpeedPct', knownSpeed)} />
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={[type.caption, { marginTop: space.sm }]}>Tip: add William, Chloe, Elsa or Saya under Heroes › Roster to see their construction bonuses here.</Text>
        )}
      </Card>

      <SectionHeader title="Resource deficit" subtitle={`Citadel ${from} → ${to}`} />
      {RESOURCE_KEYS.filter((k) => plan.totals[k] > 0).map((k) => (
        <Card key={k} style={{ marginBottom: space.sm, padding: space.md }} accent={plan.deficit[k] > 0 ? palette.danger : palette.success}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{LABEL[k]}</Text>
            <Text style={[type.number, { color: plan.deficit[k] > 0 ? palette.danger : palette.success }]}>{plan.deficit[k] > 0 ? `-${fmt(plan.deficit[k])}` : 'Covered'}</Text>
          </Row>
          <Row style={{ marginTop: space.sm }}>
            <Stat label="Needed" value={fmt(plan.totals[k])} />
            <View style={{ flex: 1 }} />
            <NumberField label="Owned" value={c.owned[k] ?? 0} onChange={(n) => set({ owned: { ...c.owned, [k]: n } })} width={140} />
          </Row>
        </Card>
      ))}

      <SectionHeader title="Prerequisite chain" />
      <Table rows={plan.levels} columns={[
        { key: 'l', title: 'Lv', flex: 0.4, render: (r) => String(r.level) },
        { key: 'r', title: 'Requires', flex: 2.4, render: (r) => r.requires.map((q) => `${q.building} ${q.level}`).join(', ') },
        { key: 't', title: 'Time', align: 'right', flex: 1.1, render: (r) => r.baseSeconds === null ? 'Unknown' : formatDurationShort(r.baseSeconds / (1 + (b.civilSpeedPct + b.builderGearPct + b.vipPct + b.institutePct) / 100)) },
      ]} />
      <Text style={[type.caption, { marginTop: space.sm }]}>Totals: {RESOURCE_KEYS.filter((k) => plan.totals[k]).map((k) => `${LABEL[k]} ${fmtFull(plan.totals[k])}`).join(' · ')}</Text>
      <ConfidenceNote confidence="community" />
    </Screen>
  );
}
