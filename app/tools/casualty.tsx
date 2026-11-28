import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { palette, space, type } from '@/theme';
import { Card, NumberField, ProgressBar, Row, Screen, SectionHeader, Segmented, Stat } from '@/components/ui';
import { TrainingCalc } from '@/components/domain/TrainingCalc';
import { fmtFull, simulateCasualties } from '@/lib/calculators';
import { useAppStore } from '@/store/useAppStore';


export default function CasualtyCalc() {
  const [tab, setTab] = useState<'Training' | 'Sanctuary'>('Training');
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Troops & Sanctuary' }} />
      <View style={{ marginTop: space.sm }}><Segmented options={['Training', 'Sanctuary'] as const} value={tab} onChange={setTab} /></View>
      {tab === 'Training' ? <TrainingCalc /> : <SanctuaryCalc />}
    </Screen>
  );
}

function SanctuaryCalc() {
  const saved = useAppStore((s) => s.savedCalcs.casualty);
  const save = useAppStore((s) => s.saveCalc);
  const [v, setV] = useState<Record<string, number>>(saved ?? { incoming: 0, tentCap: 0, tentUsed: 0, sancCap: 0, sancUsed: 0, allianceCap: 0, deadPct: 0 });
  const upd = (k: string, n: number) => { const next = { ...v, [k]: n }; setV(next); save('casualty', next); };
  // The Sanctuary holds as many troops as the Medical Tent (wiki), unless you enter your own figure.
  const sancCap = v.sancCap || v.tentCap || 0;
  const r = simulateCasualties({
    incoming: v.incoming ?? 0, medicalTentCap: v.tentCap ?? 0, medicalTentUsed: v.tentUsed ?? 0, sanctuaryCap: sancCap, sanctuaryUsed: v.sancUsed ?? 0,
    allianceHospitalCap: v.allianceCap ?? 0, permadeathRate: 0,
  });
  const total = Math.max(1, v.incoming ?? 0);
  const hasInput = (v.incoming ?? 0) > 0;
  const stages = [
    { label: 'Medical Tent', sub: 'T1 buffer · heal with resources', n: r.medicalTent, color: palette.cyan },
    { label: 'Sanctuary', sub: 'Free revival with Holy Light', n: r.sanctuary, color: palette.success },
    { label: 'Alliance Hospital', sub: 'Takes wounded beyond your Hospital; healing costs Alliance Kudos Coins', n: r.allianceHospital, color: palette.gold },
    { label: 'Permanent death', sub: 'Overflow beyond every buffer (battles can also kill some troops outright)', n: r.dead, color: palette.danger },
  ];

  return (
    <>
      <Text style={[type.bodySecondary, { marginTop: space.sm }]}>Where wounded troops go: Medical Tent first, then the Sanctuary, then permanent death. Battles can also kill part of your troops outright, which this does not include.</Text>
      <Card>
        <NumberField label="Troops that will fall (wounded + dead)" value={v.incoming ?? 0} onChange={(n) => upd('incoming', n)} />
        <Row style={{ marginTop: space.sm }}><NumberField label="Medical Tent capacity" value={v.tentCap ?? 0} onChange={(n) => upd('tentCap', n)} /><NumberField label="Already wounded" value={v.tentUsed ?? 0} onChange={(n) => upd('tentUsed', n)} /></Row>
        <Row style={{ marginTop: space.sm }}><NumberField label={v.sancCap ? 'Sanctuary capacity' : 'Sanctuary capacity (= tent)'} value={v.sancCap ?? 0} onChange={(n) => upd('sancCap', n)} /><NumberField label="Already in Sanctuary" value={v.sancUsed ?? 0} onChange={(n) => upd('sancUsed', n)} /></Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Alliance Hospital free space" value={v.allianceCap ?? 0} onChange={(n) => upd('allianceCap', n)} /></View>
      </Card>

      <SectionHeader title="Where your troops end up" />
      {stages.map((s) => (
        <Card key={s.label} style={{ padding: space.md }} accent={s.color}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}><Text style={type.heading}>{s.label}</Text><Text style={type.caption}>{s.sub}</Text></View>
            <Text style={[type.number, { color: s.color }]}>{fmtFull(s.n)}</Text>
          </Row>
          <View style={{ marginTop: space.sm }}><ProgressBar ratio={s.n / total} color={s.color} /></View>
        </Card>
      ))}
      <Card>
        <Stat label="Survival rate" value={hasInput ? `${(((total - r.dead) / total) * 100).toFixed(1)}%` : '—'} color={r.dead ? palette.gold : palette.success} />
        <Text style={[type.bodySecondary, { marginTop: space.sm }]}>
          {!hasInput ? 'Enter how many troops will fall to see the result.' : r.dead > 0 ? `${fmtFull(r.dead)} troops would die permanently. Heal the Medical Tent or revive the Sanctuary before fighting to protect more.` : 'Every fallen troop is protected.'}
        </Text>
      </Card>
    </>
  );
}
