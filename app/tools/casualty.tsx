import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { palette, space, type } from '@/theme';
import { Card, NumberField, ProgressBar, Row, Screen, SectionHeader, Segmented, Stat } from '@/components/ui';
import { fmtFull, simulateCasualties } from '@/lib/calculators';
import { useAppStore } from '@/store/useAppStore';

const SCENARIOS = ['Field', 'CoL Structure'] as const;

export default function CasualtyCalc() {
  const saved = useAppStore((s) => s.savedCalcs.casualty);
  const save = useAppStore((s) => s.saveCalc);
  const [v, setV] = useState<Record<string, number>>(saved ?? { incoming: 250000, tentCap: 120000, tentUsed: 0, sancCap: 80000, sancUsed: 0, allianceCap: 100000 });
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>('Field');
  const upd = (k: string, n: number) => { const next = { ...v, [k]: n }; setV(next); save('casualty', next); };
  const r = simulateCasualties({
    incoming: v.incoming ?? 0, medicalTentCap: v.tentCap ?? 0, medicalTentUsed: v.tentUsed ?? 0, sanctuaryCap: v.sancCap ?? 0, sanctuaryUsed: v.sancUsed ?? 0,
    allianceHospitalCap: v.allianceCap ?? 0, permadeathRate: scenario === 'CoL Structure' ? 0.3 : 0,
  });
  const total = Math.max(1, v.incoming ?? 0);
  const stages = [
    { label: 'Medical Tent', sub: 'T1 buffer · heal with resources', n: r.medicalTent, color: palette.cyan },
    { label: 'Sanctuary', sub: 'Free revival with Holy Light', n: r.sanctuary, color: palette.success },
    { label: 'Alliance Hospital', sub: 'Up to 100,000', n: r.allianceHospital, color: palette.gold },
    { label: 'Permanent death', sub: scenario === 'CoL Structure' ? 'Includes 30% CoL structure permadeath' : 'Overflow beyond every buffer', n: r.dead, color: palette.danger },
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Sanctuary Guard' }} />
      <View style={{ marginTop: space.sm }}><Segmented options={SCENARIOS} value={scenario} onChange={setScenario} /></View>
      <Card style={{ marginTop: space.md }}>
        <NumberField label="Troops that will fall (wounded + dead)" value={v.incoming ?? 0} onChange={(n) => upd('incoming', n)} />
        <Row style={{ marginTop: space.sm }}><NumberField label="Medical Tent capacity" value={v.tentCap ?? 0} onChange={(n) => upd('tentCap', n)} /><NumberField label="Already wounded" value={v.tentUsed ?? 0} onChange={(n) => upd('tentUsed', n)} /></Row>
        <Row style={{ marginTop: space.sm }}><NumberField label="Sanctuary capacity" value={v.sancCap ?? 0} onChange={(n) => upd('sancCap', n)} /><NumberField label="Already in Sanctuary" value={v.sancUsed ?? 0} onChange={(n) => upd('sancUsed', n)} /></Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Alliance Hospital space for you" value={v.allianceCap ?? 0} onChange={(n) => upd('allianceCap', Math.min(n, 100000))} /></View>
      </Card>

      <SectionHeader title="Where your troops end up" />
      {stages.map((s) => (
        <Card key={s.label} style={{ marginBottom: space.sm, padding: space.md }} accent={s.color}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}><Text style={type.heading}>{s.label}</Text><Text style={type.caption}>{s.sub}</Text></View>
            <Text style={[type.number, { color: s.color }]}>{fmtFull(s.n)}</Text>
          </Row>
          <View style={{ marginTop: space.sm }}><ProgressBar ratio={s.n / total} color={s.color} /></View>
        </Card>
      ))}
      <Card style={{ marginTop: space.sm }}>
        <Stat label="Survival rate" value={`${(((total - r.dead) / total) * 100).toFixed(1)}%`} color={r.dead ? palette.gold : palette.success} />
        <Text style={[type.bodySecondary, { marginTop: space.sm }]}>
          {r.dead > 0 ? `Heal the Medical Tent or revive the Sanctuary before fighting — ${fmtFull(r.dead)} troops would die permanently.` : 'Every fallen troop is protected.'}
        </Text>
      </Card>
    </Screen>
  );
}
