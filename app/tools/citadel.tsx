import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { citadelLevels, heroes } from '@/data/seed';
import { palette, space, type } from '@/theme';
import { Card, ConfidenceNote, NumberField, Row, Screen, SectionHeader, Stat, Table } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { fmt, fmtFull, planCitadel, RESOURCE_KEYS, type ResourceKey } from '@/lib/calculators';
import { formatDurationShort } from '@/lib/time';

const LABEL: Record<ResourceKey, string> = { food: 'Food', wood: 'Wood', stone: 'Stone', iron: 'Iron', ancientTome: 'Ancient Tome', astronomyTome: 'Astronomy Tome', gloryCodex: 'Glory Codex', goldStatue: 'Gold Statue' };
const civilBuild = heroes.flatMap((h) => h.civilSkills.filter((s) => s.stat === 'buildSpeed' || s.stat === 'buildCost').map((s) => ({ hero: h.name, ...s })));

export default function CitadelPlanner() {
  const c = useAppStore((s) => s.citadel);
  const set = useAppStore((s) => s.setCitadel);
  const from = Math.min(Math.max(0, c.from), 39);
  const to = Math.min(Math.max(from + 1, c.to), 40);
  const plan = planCitadel(citadelLevels, from, to, c.owned, c.bonuses);
  const b = c.bonuses;
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
        <Text style={[type.caption, { marginTop: space.sm }]}>Own-only civil passives: {civilBuild.map((x) => `${x.hero} ${x.stat === 'buildCost' ? 'cost' : 'speed'} ${x.value !== undefined ? `${x.value}%` : '(value not verified)'}`).join(' · ')}</Text>
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
