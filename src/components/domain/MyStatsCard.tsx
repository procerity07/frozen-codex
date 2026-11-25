import { useState } from 'react';
import { TextInput, Text, View } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { Button, Card, Row, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { palette, radius, space, type } from '@/theme';

/** Passive totals as shown in-game under Lord Details. Attack stats are left out on purpose. */
const GROUPS: { title: string; items: { key: string; label: string; unit: '%' | '' }[] }[] = [
  { title: 'Building', items: [
    { key: 'buildSpeed', label: 'Building speed', unit: '%' },
    { key: 'buildCostPct', label: 'Building cost', unit: '%' },
    { key: 'buildFood', label: 'Building food cut', unit: '' },
    { key: 'buildWood', label: 'Building wood cut', unit: '' },
    { key: 'buildStone', label: 'Building stone cut', unit: '' },
    { key: 'buildIron', label: 'Building iron cut', unit: '' },
  ] },
  { title: 'Research', items: [
    { key: 'researchSpeed', label: 'Research speed', unit: '%' },
    { key: 'researchCostPct', label: 'Research cost', unit: '%' },
    { key: 'researchFood', label: 'Research food cut', unit: '' },
    { key: 'researchWood', label: 'Research wood cut', unit: '' },
    { key: 'researchStone', label: 'Research stone cut', unit: '' },
    { key: 'researchIron', label: 'Research iron cut', unit: '' },
  ] },
  { title: 'Troops & city', items: [
    { key: 'trainSpeed', label: 'Training speed', unit: '%' },
    { key: 'healSpeed', label: 'Healing speed', unit: '%' },
    { key: 'troopCap', label: 'Troop capacity (march size)', unit: '' },
    { key: 'gatherSpeed', label: 'Gathering speed', unit: '%' },
    { key: 'marchSpeed', label: 'March speed', unit: '%' },
    { key: 'safeRes', label: 'Safe resources', unit: '' },
  ] },
];

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 3 });

function StatInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(value ? String(value) : '');
  return (
    <TextInput
      value={text}
      onChangeText={(t) => { const c = t.replace(/[^0-9.]/g, ''); setText(c); onChange(Number(c) || 0); }}
      keyboardType="decimal-pad"
      placeholder="0"
      placeholderTextColor={palette.textMuted}
      selectionColor={palette.cyan}
      style={{ minWidth: 110, textAlign: 'right', color: palette.text, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 4 }}
    />
  );
}

export function MyStatsCard() {
  const stats = useAppStore((s) => s.myStats);
  const setStat = useAppStore((s) => s.setMyStat);
  const citadel = useAppStore((s) => s.citadel);
  const setCitadel = useAppStore((s) => s.setCitadel);
  const [editing, setEditing] = useState(false);
  const filled = Object.values(stats).some((v) => v > 0);
  const v = (k: string) => stats[k] ?? 0;

  const useInPlanner = () => setCitadel({
    bonuses: {
      ...citadel.bonuses,
      civilSpeedPct: v('buildSpeed'), builderGearPct: 0, vipPct: 0, institutePct: 0,
      costReductionPct: v('buildCostPct'),
      flatCut: { food: v('buildFood'), wood: v('buildWood'), stone: v('buildStone'), iron: v('buildIron') },
      off: {},
    },
  });

  return (
    <>
      <SectionHeader title="My overall stats" icon={BarChart3} subtitle="Your passive totals from everything together: heroes, gear, research, VIP and more" />
      <Card>
        <Text style={type.caption}>
          Copy them from the game: tap your avatar → Lord Details. Attack and defence stats are left out because they depend on your march.
        </Text>
        {!filled && !editing ? (
          <View style={{ marginTop: space.sm }}><Button label="Enter my stats" onPress={() => setEditing(true)} /></View>
        ) : (
          <>
            {GROUPS.map((g) => {
              const shown = editing ? g.items : g.items.filter((i) => v(i.key) > 0);
              if (!shown.length) return null;
              return (
                <View key={g.title} style={{ marginTop: space.md }}>
                  <Text style={[type.heading, { marginBottom: space.xs }]}>{g.title}</Text>
                  {shown.map((i) => {
                    const minus = /cost|cut/i.test(i.label);
                    return (
                      <Row key={i.key} style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
                        <Text style={[type.body, { flex: 1 }]}>{i.label}</Text>
                        {editing ? <StatInput value={v(i.key)} onChange={(n) => setStat(i.key, n)} /> : (
                          <Text style={[type.body, { color: palette.success }]} noTranslate>{`${minus ? '−' : '+'}${fmt(v(i.key))}${i.unit}`}</Text>
                        )}
                      </Row>
                    );
                  })}
                </View>
              );
            })}
            <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
              <Button compact variant={editing ? undefined : 'ghost'} label={editing ? 'Done' : 'Edit'} onPress={() => setEditing(!editing)} />
              {!editing && (v('buildSpeed') || v('buildCostPct')) ? <Button compact variant="ghost" label="Use in Citadel Planner" onPress={useInPlanner} /> : null}
            </Row>
            {editing ? <Text style={[type.caption, { marginTop: space.xs }]}>Type the numbers without the minus sign. Leave anything you don't have at 0.</Text> : null}
          </>
        )}
      </Card>
    </>
  );
}
