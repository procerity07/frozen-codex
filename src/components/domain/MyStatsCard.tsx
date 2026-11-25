import { useState } from 'react';
import { Pressable, TextInput, Text, View } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { Button, Card, Row, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { palette, radius, space, type } from '@/theme';

/** Mirrors the in-game Lord Details screen, section by section, with the game's own labels. */
interface StatItem { key: string; label: string; unit: '%' | ''; neg?: boolean }
const GROUPS: { title: string; power?: boolean; items: StatItem[] }[] = [
  { title: 'Economy Enhancement', items: [
    { key: 'outFood', label: 'Food Output', unit: '%' },
    { key: 'outWood', label: 'Wood Output', unit: '%' },
    { key: 'outStone', label: 'Stone Output', unit: '%' },
    { key: 'outIron', label: 'Iron Output', unit: '%' },
    { key: 'gatherSpeed', label: 'Resource Gather Speed', unit: '%' },
    { key: 'gatherFood', label: 'Food Gather Speed', unit: '%' },
    { key: 'gatherWood', label: 'Wood Gather Speed', unit: '%' },
    { key: 'gatherStone', label: 'Stone Gather Speed', unit: '%' },
    { key: 'gatherIron', label: 'Iron Gather Speed', unit: '%' },
    { key: 'troopLoad', label: 'Troop Load', unit: '%' },
    { key: 'buildSpeed', label: 'Construction Speed', unit: '%' },
    { key: 'buildCostPct', label: 'Food Cost in Construction', unit: '%', neg: true },
    { key: 'buildFood', label: 'Food Cost in Construction', unit: '', neg: true },
    { key: 'buildWoodPct', label: 'Wood Cost in Construction', unit: '%', neg: true },
    { key: 'buildWood', label: 'Wood Cost in Construction', unit: '', neg: true },
    { key: 'buildStonePct', label: 'Stone Cost in Construction', unit: '%', neg: true },
    { key: 'buildStone', label: 'Stone Cost in Construction', unit: '', neg: true },
    { key: 'buildIronPct', label: 'Iron Cost in Construction', unit: '%', neg: true },
    { key: 'buildIron', label: 'Iron Cost in Construction', unit: '', neg: true },
    { key: 'researchSpeed', label: 'Research Speed', unit: '%' },
    { key: 'researchCostPct', label: 'Food Cost in Research', unit: '%', neg: true },
    { key: 'researchFood', label: 'Food Cost in Research', unit: '', neg: true },
    { key: 'researchWoodPct', label: 'Wood Cost in Research', unit: '%', neg: true },
    { key: 'researchWood', label: 'Wood Cost in Research', unit: '', neg: true },
    { key: 'researchStonePct', label: 'Stone Cost in Research', unit: '%', neg: true },
    { key: 'researchStone', label: 'Stone Cost in Research', unit: '', neg: true },
    { key: 'researchIronPct', label: 'Iron Cost in Research', unit: '%', neg: true },
    { key: 'researchIron', label: 'Iron Cost in Research', unit: '', neg: true },
    { key: 'safeRes', label: 'Safe Resources', unit: '' },
    { key: 'lordExp', label: 'Lord EXP Bonus', unit: '%' },
    { key: 'transportLoad', label: 'Resource Transport Load', unit: '' },
    { key: 'expPotion', label: 'EXP Potion Output', unit: '%' },
  ] },
  { title: 'Troop Enhancement', items: [
    { key: 'troopATK', label: 'Troop ATK', unit: '%' },
    { key: 'troopDEF', label: 'Troop DEF', unit: '%' },
    { key: 'troopHP', label: 'Troop HP', unit: '%' },
    { key: 'infantryATK', label: 'Infantry ATK', unit: '%' },
    { key: 'infantryDEF', label: 'Infantry DEF', unit: '%' },
    { key: 'infantryHP', label: 'Infantry HP', unit: '%' },
    { key: 'archerATK', label: 'Archer ATK', unit: '%' },
    { key: 'archerDEF', label: 'Archer DEF', unit: '%' },
    { key: 'archerHP', label: 'Archer HP', unit: '%' },
    { key: 'cavalryATK', label: 'Cavalry ATK', unit: '%' },
    { key: 'cavalryDEF', label: 'Cavalry DEF', unit: '%' },
    { key: 'cavalryHP', label: 'Cavalry HP', unit: '%' },
    { key: 'vehicleATK', label: 'Vehicle ATK', unit: '%' },
    { key: 'vehicleDEF', label: 'Vehicle DEF', unit: '%' },
    { key: 'vehicleHP', label: 'Vehicle HP', unit: '%' },
    { key: 'dmgUp', label: 'Troop Dmg Up', unit: '%' },
    { key: 'dmgTakenDown', label: 'Troop Dmg Taken Down', unit: '%' },
    { key: 'wallHp', label: 'Wall HP', unit: '' },
    { key: 'casualtyDown', label: 'Casualty in Battle Down', unit: '%', neg: true },
  ] },
  { title: 'Attributes Enhancement', items: [
    { key: 'trainSpeed', label: 'Training Speed', unit: '%' },
    { key: 'trainCap', label: 'Barracks Training Capacity', unit: '' },
    { key: 'healSpeed', label: 'Medical Tent Healing Speed', unit: '%' },
    { key: 'tentCap', label: 'Medical Tent Capacity Up', unit: '' },
  ] },
  { title: 'March Enhancement', items: [
    { key: 'troopCap', label: 'Troop Capacity', unit: '' },
    { key: 'marchSpeed', label: 'March Speed', unit: '%' },
    { key: 'gatherMarch', label: 'Gather March Speed', unit: '%' },
    { key: 'huntMarch', label: 'Hunt March Speed', unit: '%' },
    { key: 'rallySize', label: 'Rally Size', unit: '' },
    { key: 'marchQueue', label: 'March Queue Limit', unit: '' },
  ] },
  { title: 'Hunt Enhancement', items: [
    { key: 'huntAtk', label: 'Hunt ATK', unit: '%' },
    { key: 'huntStamina', label: 'Hunt Stamina Cost', unit: '%', neg: true },
    { key: 'huntRegen', label: 'Hunt Stamina Regen', unit: '%' },
  ] },
  { title: 'Scramble Boosts', items: [
    { key: 'scrDmg', label: 'Scramble Troop Dmg Up', unit: '%' },
    { key: 'scrInfantryonArcher', label: "Scramble Infantry's Counter on Archer Down", unit: '%' },
    { key: 'scrInfantrybyCavalry', label: "Scramble Infantry's Counter by Cavalry Down", unit: '%' },
    { key: 'scrArcheronCavalry', label: "Scramble Archer's Counter on Cavalry Down", unit: '%' },
    { key: 'scrArcherbyInfantry', label: "Scramble Archer's Counter by Infantry Down", unit: '%' },
    { key: 'scrCavalryonInfantry', label: "Scramble Cavalry's Counter on Infantry Down", unit: '%' },
    { key: 'scrCavalrybyArcher', label: "Scramble Cavalry's Counter by Archer Down", unit: '%' },
  ] },
  { title: 'Power Statistics', power: true, items: [
    { key: 'pwGear', label: 'Gear', unit: '' },
    { key: 'pwRune', label: 'Rune', unit: '' },
    { key: 'pwTotem', label: 'Totem', unit: '' },
    { key: 'pwHolystone', label: 'Holystone', unit: '' },
    { key: 'pwHero', label: 'Hero', unit: '' },
    { key: 'pwTroops', label: 'Troops', unit: '' },
    { key: 'pwResearch', label: 'Research', unit: '' },
    { key: 'pwBuilding', label: 'Building', unit: '' },
    { key: 'pwLordLevel', label: 'Lord Level', unit: '' },
    { key: 'pwGloryLevel', label: 'Glory Level', unit: '' },
    { key: 'pwDragonPower', label: 'Dragon Power', unit: '' },
    { key: 'pwCurio', label: 'Curio', unit: '' },
    { key: 'pwArtifact', label: 'Artifact', unit: '' },
    { key: 'pwDraconicStone', label: 'Draconic Stone', unit: '' },
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
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
      <SectionHeader title="My overall stats" icon={BarChart3} subtitle="Everything together, as in Lord Details" />
      <Card>
        <Text style={type.caption}>
          The same totals as the game's Lord Details screen (tap your avatar → Lord Details), built from everything: gear, runes, totems, research, heroes, dragon and more. Copy in the ones you want; tap a section to fold it.
        </Text>
        {!filled && !editing ? (
          <View style={{ marginTop: space.sm }}><Button label="Enter my stats" onPress={() => setEditing(true)} /></View>
        ) : (
          <>
            {GROUPS.map((g) => {
              const shown = editing ? g.items : g.items.filter((i) => v(i.key) > 0);
              if (!shown.length) return null;
              const isOpen = editing || openGroups[g.title] !== false;
              const total = g.power ? g.items.reduce((t, i) => t + v(i.key), 0) : 0;
              return (
                <View key={g.title} style={{ marginTop: space.md }}>
                  <Pressable onPress={() => setOpenGroups({ ...openGroups, [g.title]: !isOpen })} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: palette.surface, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6 }}>
                    <Text style={type.heading}>{g.title}</Text>
                    <Text style={[type.heading, { color: palette.cyan }]} noTranslate>{`${g.power && total ? fmt(total) + '  ' : ''}${isOpen ? '▾' : '▸'}`}</Text>
                  </Pressable>
                  {isOpen ? shown.map((i) => (
                    <Row key={i.key} style={{ justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: space.sm }}>
                      <Text style={[type.body, { flex: 1 }]}>{`${i.label}${i.neg && !i.unit && editing ? ' (flat)' : ''}`}</Text>
                      {editing ? <StatInput value={v(i.key)} onChange={(n) => setStat(i.key, n)} /> : (
                        <Text style={[type.body, { color: palette.gold }]} noTranslate>{`${i.neg ? '-' : ''}${fmt(v(i.key))}${i.unit}`}</Text>
                      )}
                    </Row>
                  )) : null}
                </View>
              );
            })}
            <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
              <Button compact variant={editing ? undefined : 'ghost'} label={editing ? 'Done' : 'Edit'} onPress={() => setEditing(!editing)} />
              {!editing && (v('buildSpeed') || v('buildCostPct')) ? <Button compact variant="ghost" label="Use in Citadel Planner" onPress={useInPlanner} /> : null}
            </Row>
            {editing ? <Text style={[type.caption, { marginTop: space.xs }]}>Type numbers without the minus sign; the minus is added for costs. Leave anything you don't need at 0.</Text> : null}
          </>
        )}
      </Card>
    </>
  );
}
