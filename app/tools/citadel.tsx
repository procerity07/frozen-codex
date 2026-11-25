import { Switch, Text, View } from 'react-native';
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
  const from = Math.min(Math.max(1, c.from || 1), 40);
  const atMax = from >= 40;
  const to = atMax ? 40 : Math.min(Math.max(from + 1, c.to || 0), 40);
  const plan = planCitadel(citadelLevels, from, to, c.owned, c.bonuses);
  const b = c.bonuses;
  const roster = useAppStore((s) => s.roster);
  const buildBonuses = civilBonuses(heroes, roster).filter((x) => x.stat === 'buildSpeed' || x.stat === 'buildCost');
  const knownSpeed = buildBonuses.filter((x) => x.stat === 'buildSpeed' && x.active && x.value !== null).reduce((t, x) => t + x.value!, 0);
  // Flat construction cost cuts from owned heroes (e.g. Chloe: Stone/Iron, William: Food/Wood), per upgrade.
  const heroFlat: Record<'food' | 'wood' | 'stone' | 'iron', number> = { food: 0, wood: 0, stone: 0, iron: 0 };
  for (const x of buildBonuses) {
    if (!x.active || x.value === null || x.unit !== 'flat') continue;
    const m = /Construction (Food|Wood|Stone|Iron) Cost/.exec(x.skill);
    if (m) heroFlat[m[1]!.toLowerCase() as keyof typeof heroFlat] += Math.abs(x.value);
  }
  const hasHeroFlat = Object.values(heroFlat).some(Boolean);
  const setB = (k: 'civilSpeedPct' | 'builderGearPct' | 'vipPct' | 'institutePct' | 'costReductionPct', v: number) => set({ bonuses: { ...b, [k]: v } });
  const flat = b.flatCut ?? {};
  const setFlat = (k: keyof typeof heroFlat, v: number) => set({ bonuses: { ...b, flatCut: { ...flat, [k]: v } } });
  const isOn = (k: keyof NonNullable<typeof b.off>) => !b.off?.[k];
  const toggle = (k: keyof NonNullable<typeof b.off>) => set({ bonuses: { ...b, off: { ...b.off, [k]: isOn(k) } } });
  // A plain function (not a component) so typing does not remount the input and close the keyboard.
  const boost = (k: 'civilSpeedPct' | 'builderGearPct' | 'vipPct' | 'institutePct' | 'costReductionPct', label: string, hint: string) => (
    <Row key={k} style={{ marginTop: space.sm, alignItems: 'flex-end' }}>
      <Switch value={isOn(k)} onValueChange={() => toggle(k)} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
      <View style={{ flex: 1, opacity: isOn(k) ? 1 : 0.4 }}>
        <NumberField label={label} value={b[k] || 0} onChange={(n) => setB(k, k === 'costReductionPct' ? Math.min(n, 90) : n)} suffix="%" />
        <Text style={type.caption}>{hint}</Text>
      </View>
    </Row>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Citadel Planner' }} />
      <Card style={{ marginTop: space.sm }}>
        <Row>
          <NumberField label="Current Citadel (1–40)" value={c.from} onChange={(n) => set({ from: Math.min(40, n) })} />
          <NumberField label="Target Citadel" value={c.to} onChange={(n) => set({ to: Math.min(40, n) })} />
        </Row>
        {atMax ? <Text style={[type.caption, { marginTop: space.sm, color: palette.success }]}>Citadel 40 is the maximum level.</Text>
          : c.to <= from ? <Text style={[type.caption, { marginTop: space.sm }]}>Showing Citadel {from} → {to}. Set a higher target to plan further.</Text> : null}
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

      <SectionHeader title="Boosts" subtitle="Switch each on or off; values are kept" />
      <Card>
        <Text style={type.heading}>Build speed</Text>
        {boost('civilSpeedPct', 'Civil hero speed', "Saya, Elsa and other heroes with Construction Speed")}
        {boost('builderGearPct', 'Builder gear', "Builder's Set: construction speed on your gear")}
        {boost('vipPct', 'VIP', "Construction speed from your VIP level")}
        {boost('institutePct', 'Institute research', "Construction speed researched in the Institute")}
        {knownSpeed ? (
          <View style={{ marginTop: space.sm }}>
            <Button compact variant="secondary" label={`Use my heroes: +${knownSpeed}% civil hero speed`} onPress={() => setB('civilSpeedPct', knownSpeed)} />
          </View>
        ) : null}

        <Text style={[type.heading, { marginTop: space.lg }]}>Cheaper upgrades</Text>
        {boost('costReductionPct', 'Cost reduction', "Percentage cuts, e.g. Dragon's Lair or events")}
        <Row style={{ marginTop: space.md, justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Flat cut per upgrade</Text>
            <Text style={type.caption}>Heroes like William (Food/Wood) and Chloe (Stone/Iron) take a fixed amount off every upgrade.</Text>
          </View>
          <Switch value={isOn('flatCut')} onValueChange={() => toggle('flatCut')} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
        </Row>
        <View style={{ opacity: isOn('flatCut') ? 1 : 0.4 }}>
          <Row style={{ marginTop: space.sm }}>
            <NumberField label="Food" value={flat.food ?? 0} onChange={(n) => setFlat('food', n)} />
            <NumberField label="Wood" value={flat.wood ?? 0} onChange={(n) => setFlat('wood', n)} />
          </Row>
          <Row style={{ marginTop: space.sm }}>
            <NumberField label="Stone" value={flat.stone ?? 0} onChange={(n) => setFlat('stone', n)} />
            <NumberField label="Iron" value={flat.iron ?? 0} onChange={(n) => setFlat('iron', n)} />
          </Row>
          {hasHeroFlat ? (
            <View style={{ marginTop: space.sm }}>
              <Button compact variant="secondary" label="Use my heroes' flat cuts" onPress={() => set({ bonuses: { ...b, flatCut: heroFlat } })} />
            </View>
          ) : null}
        </View>

        {buildBonuses.length ? (
          <View style={{ marginTop: space.md, gap: 4 }}>
            <Text style={type.caption}>From My Heroes</Text>
            {buildBonuses.map((x) => (
              <Text key={`${x.heroId}-${x.skill}`} style={type.bodySecondary}>
                {x.hero}: {x.skill} {x.active && x.value !== null ? (x.unit === 'flat' ? `${x.value < 0 ? '−' : '+'}${fmtFull(Math.abs(x.value))} per upgrade` : `${x.value < 0 ? '' : '+'}${x.value}%`) : `(${x.note.toLowerCase()})`}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={[type.caption, { marginTop: space.sm }]}>Tip: add William, Chloe, Elsa or Saya under Heroes › Roster to fill these in with one tap.</Text>
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
        { key: 't', title: 'Time', align: 'right', flex: 1.1, render: (r) => r.baseSeconds === null ? 'Unknown' : formatDurationShort(r.baseSeconds / plan.speed) },
      ]} />
      <Text style={[type.caption, { marginTop: space.sm }]}>Totals: {RESOURCE_KEYS.filter((k) => plan.totals[k]).map((k) => `${LABEL[k]} ${fmtFull(plan.totals[k])}`).join(' · ')}</Text>
      <ConfidenceNote confidence="community" />
    </Screen>
  );
}
