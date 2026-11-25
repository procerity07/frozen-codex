import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { palette, space, type } from '@/theme';
import { Card, Chip, ChipRow, NumberField, ProgressBar, Row, Screen, SectionHeader, Stat } from '@/components/ui';
import { fmtFull, simulateCasualties } from '@/lib/calculators';
import { useAppStore } from '@/store/useAppStore';


export default function CasualtyCalc() {
  const saved = useAppStore((s) => s.savedCalcs.casualty);
  const save = useAppStore((s) => s.saveCalc);
  const [v, setV] = useState<Record<string, number>>(saved ?? { incoming: 0, tentCap: 0, tentUsed: 0, sancCap: 0, sancUsed: 0, allianceCap: 0, deadPct: 0 });
  const upd = (k: string, n: number) => { const next = { ...v, [k]: n }; setV(next); save('casualty', next); };
  const deadPct = Math.min(100, Math.max(0, v.deadPct ?? 0));
  // The Sanctuary holds as many troops as the Medical Tent (wiki), unless you enter your own figure.
  const sancCap = v.sancCap || v.tentCap || 0;
  const r = simulateCasualties({
    incoming: v.incoming ?? 0, medicalTentCap: v.tentCap ?? 0, medicalTentUsed: v.tentUsed ?? 0, sanctuaryCap: sancCap, sanctuaryUsed: v.sancUsed ?? 0,
    allianceHospitalCap: v.allianceCap ?? 0, permadeathRate: deadPct / 100,
  });
  const total = Math.max(1, v.incoming ?? 0);
  const hasInput = (v.incoming ?? 0) > 0;
  const stages = [
    { label: 'Medical Tent', sub: 'T1 buffer · heal with resources', n: r.medicalTent, color: palette.cyan },
    { label: 'Sanctuary', sub: 'Free revival with Holy Light', n: r.sanctuary, color: palette.success },
    { label: 'Alliance Hospital', sub: 'Not verified in-game; leave 0 if your game has none', n: r.allianceHospital, color: palette.gold },
    { label: 'Permanent death', sub: deadPct ? `${deadPct}% die outright, plus any overflow` : 'Overflow beyond every buffer', n: r.dead, color: palette.danger },
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Sanctuary Guard' }} />
      <Text style={[type.bodySecondary, { marginTop: space.sm }]}>Enter your own numbers to see where fallen troops go: Medical Tent first, then the Sanctuary, then permanent death.</Text>
      <Card style={{ marginTop: space.md }}>
        <NumberField label="% that die outright in this fight (0 if none)" value={deadPct} onChange={(n) => upd('deadPct', Math.min(100, n))} suffix="%" />
        <Text style={[type.caption, { marginTop: 4 }]}>Castle attacks, being attacked and some war events kill part of the troops permanently. The exact rate is not verified, so enter what you see in your battle reports.</Text>
        <ChipRow>{[0, 10, 20, 30].map((p) => <Chip key={p} label={`${p}%`} active={deadPct === p} onPress={() => upd('deadPct', p)} />)}</ChipRow>
      </Card>
      <Card style={{ marginTop: space.md }}>
        <NumberField label="Troops that will fall (wounded + dead)" value={v.incoming ?? 0} onChange={(n) => upd('incoming', n)} />
        <Row style={{ marginTop: space.sm }}><NumberField label="Medical Tent capacity" value={v.tentCap ?? 0} onChange={(n) => upd('tentCap', n)} /><NumberField label="Already wounded" value={v.tentUsed ?? 0} onChange={(n) => upd('tentUsed', n)} /></Row>
        <Row style={{ marginTop: space.sm }}><NumberField label={v.sancCap ? 'Sanctuary capacity' : 'Sanctuary capacity (= tent)'} value={v.sancCap ?? 0} onChange={(n) => upd('sancCap', n)} /><NumberField label="Already in Sanctuary" value={v.sancUsed ?? 0} onChange={(n) => upd('sancUsed', n)} /></Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Alliance Hospital space (not verified)" value={v.allianceCap ?? 0} onChange={(n) => upd('allianceCap', n)} /></View>
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
        <Stat label="Survival rate" value={hasInput ? `${(((total - r.dead) / total) * 100).toFixed(1)}%` : '—'} color={r.dead ? palette.gold : palette.success} />
        <Text style={[type.bodySecondary, { marginTop: space.sm }]}>
          {!hasInput ? 'Enter how many troops will fall to see the result.' : r.dead > 0 ? `${fmtFull(r.dead)} troops would die permanently. Heal the Medical Tent or revive the Sanctuary before fighting to protect more.` : 'Every fallen troop is protected.'}
        </Text>
      </Card>
    </Screen>
  );
}
