import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import type { Element, Hero, Rarity, UnitType } from '@/types/game';
import { listHeroes } from '@/db/repo';
import { bondGifts, bondGroups, bondLevels, curioStarCosts, curios, heroes as seedHeroes, troopTriangle } from '@/data/seed';
import { elementColors, palette, rarityColors, space, troopColors, type } from '@/theme';
import { Badge, Card, Chip, ChipRow, ElementEmblem, EmptyState, Field, NumberField, Row, Screen, SectionHeader, Segmented, Stat, Table, TroopEmblem } from '@/components/ui';
import { HeroCard } from '@/components/domain/HeroCard';
import { ElementWheel, TroopTriangle } from '@/components/domain/CounterVisualizers';
import { useAppStore } from '@/store/useAppStore';
import { bondExpBetween, bondGiftPlan, curioCost, fmtFull } from '@/lib/calculators';

const ELEMENTS: Element[] = ['Fire', 'Ice', 'Nature', 'Light', 'Dark'];
const RARITIES: Rarity[] = [6, 5, 4, 3, 2];
const UNITS: UnitType[] = ['Infantry', 'Cavalry', 'Archer', 'All-round', 'Civil'];
const VIEWS = ['Codex', 'Counters', 'Bonds', 'Curios'] as const;

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function HeroesScreen() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Codex');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs }}>
        <Segmented options={VIEWS} value={view} onChange={setView} />
      </View>
      {view === 'Codex' ? <Codex /> : view === 'Counters' ? <Counters /> : view === 'Bonds' ? <Bonds /> : <Curios />}
    </View>
  );
}

function Codex() {
  const focus = useAppStore((s) => s.troopFocus);
  const [q, setQ] = useState('');
  const [els, setEls] = useState<Element[]>([]);
  const [rars, setRars] = useState<Rarity[]>([]);
  const [units, setUnits] = useState<UnitType[]>([]);
  const [rows, setRows] = useState<Hero[]>([]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      listHeroes({ query: q.trim() || undefined, elements: els, rarities: rars, unitTypes: units })
        .then((r) => { if (alive) setRows(r); })
        .catch(() => { if (alive) setRows([]); });
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [q, els, rars, units]);

  const sorted = useMemo(() => (focus === 'All' ? rows : [...rows].sort((a, b) => Number(b.unitType === focus) - Number(a.unitType === focus))), [rows, focus]);

  return (
    <FlatList
      data={sorted}
      keyExtractor={(h) => h.id}
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 48 }}
      ListHeaderComponent={
        <View style={{ backgroundColor: palette.bg, paddingBottom: space.xs }}>
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
            <Row>
              <Search size={16} color={palette.textMuted} />
              <Field placeholder="Search heroes, skills, sources" value={q} onChangeText={setQ} autoCorrect={false} />
            </Row>
          </View>
          <ChipRow>
            {ELEMENTS.map((e) => <Chip key={e} label={e} active={els.includes(e)} color={elementColors[e]} leading={<ElementEmblem element={e} size={16} />} onPress={() => setEls(toggle(els, e))} />)}
          </ChipRow>
          <ChipRow>
            {RARITIES.map((r) => <Chip key={r} label={`${r}-Star`} active={rars.includes(r)} color={rarityColors[r]} onPress={() => setRars(toggle(rars, r))} />)}
            {UNITS.map((u) => <Chip key={u} label={u} active={units.includes(u)} color={troopColors[u]} leading={<TroopEmblem type={u} size={16} />} onPress={() => setUnits(toggle(units, u))} />)}
          </ChipRow>
          <Text style={[type.caption, { paddingHorizontal: space.lg }]}>{sorted.length} heroes{focus !== 'All' ? ` · ${focus} heroes listed first` : ''}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: space.lg }}>
          <HeroCard hero={item} focus={focus} onPress={() => router.push(`/hero/${item.id}`)} />
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No heroes match" body="Clear a filter or try a shorter search." />}
    />
  );
}

function Counters() {
  return (
    <Screen>
      <SectionHeader title="Match-3 elemental wheel" subtitle="Tap an element to trace its matchups" />
      <Card><ElementWheel /></Card>
      <SectionHeader title="Kingdom troop triangle" subtitle="Infantry › Archer › Cavalry › Infantry" />
      <Card><TroopTriangle /></Card>
      <SectionHeader title="Institute Lv. 28 formations" />
      {troopTriangle.formations.map((f) => (
        <Card key={f.name} style={{ marginBottom: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{f.name}</Text>
            <Badge label={f.unlock} color={palette.cyan} />
          </Row>
          <Text style={[type.bodySecondary, { marginTop: 4 }]}>{f.effect}</Text>
        </Card>
      ))}
    </Screen>
  );
}

function Bonds() {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(30);
  const [owned, setOwned] = useState<Record<number, number>>({});
  const f = Math.min(Math.max(1, from), 90);
  const t = Math.min(Math.max(f, to), 90);
  const need = bondExpBetween(bondLevels, f, t);
  const plan = bondGiftPlan(bondGifts, owned, need);
  const ownedExp = bondGifts.reduce((s, g) => s + (owned[g.tier] ?? 0) * g.exp, 0);
  const nameOf = (id: string) => seedHeroes.find((h) => h.id === id)?.name ?? id;
  return (
    <Screen>
      <SectionHeader title="Bond EXP planner" subtitle="Stranger (Lv. 1) to Confidant (Lv. 80+)" />
      <Card>
        <Row>
          <NumberField label="Current level" value={from} onChange={setFrom} />
          <NumberField label="Target level" value={to} onChange={setTo} />
        </Row>
        <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
          <Stat label="EXP needed" value={fmtFull(need)} color={palette.cyan} />
          <Stat label="EXP in bag" value={fmtFull(ownedExp)} align="right" color={ownedExp >= need ? palette.success : palette.gold} />
        </Row>
        <Text style={[type.caption, { marginTop: space.sm }]}>{bondLevels[f - 1]?.title} → {bondLevels[t - 1]?.title}</Text>
      </Card>
      <SectionHeader title="Bond gifts in bag" />
      <Card>
        {bondGifts.map((g) => (
          <Row key={g.tier} style={{ marginBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={type.body}>T{g.tier} {g.name}</Text>
              <Text style={type.caption}>{fmtFull(g.exp)} EXP each</Text>
            </View>
            <NumberField value={owned[g.tier] ?? 0} onChange={(n) => setOwned({ ...owned, [g.tier]: n })} width={100} />
          </Row>
        ))}
        <Text style={[type.caption, { marginTop: space.sm }]}>
          Use: {plan.used.length ? plan.used.map((u) => `${u.count}× T${u.tier}`).join(', ') : 'nothing yet'}
          {plan.shortfall > 0 ? ` · short ${fmtFull(plan.shortfall)} EXP` : ' · target reachable'}
        </Text>
      </Card>
      <SectionHeader title="Bond groups" />
      {bondGroups.map((g) => (
        <Card key={g.id} style={{ marginBottom: space.sm }}>
          <Text style={type.heading}>{g.name}</Text>
          <Text style={[type.caption, { marginTop: 2 }]}>{g.members.map(nameOf).join(' · ')}</Text>
          <View style={{ marginTop: space.sm, gap: 4 }}>
            {g.bonuses.map((b) => (
              <Row key={b.level}><Badge label={`Lv. ${b.level}`} color={palette.gold} /><Text style={type.bodySecondary}>{b.effect}</Text></Row>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function Curios() {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(5);
  const c = curioCost(curioStarCosts, Math.min(from, 10), Math.min(Math.max(from, to), 10));
  return (
    <Screen>
      <SectionHeader title="Curio ascend calculator" subtitle="Unlocks at Weapon Forge Lv. 20" />
      <Card>
        <Row>
          <NumberField label="Current star" value={from} onChange={setFrom} />
          <NumberField label="Target star" value={to} onChange={setTo} />
        </Row>
        <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
          <Stat label="Curio Spinel" value={fmtFull(c.spinel)} color={palette.cyan} />
          <Stat label="Curio Crystal" value={fmtFull(c.crystal)} color={palette.gold} align="right" />
        </Row>
        {c.unlocks.map((u) => <Text key={u} style={[type.caption, { marginTop: 4 }]}>{u}</Text>)}
      </Card>
      <SectionHeader title="Star cost table" />
      <Table
        rows={curioStarCosts}
        columns={[
          { key: 's', title: 'Star', flex: 0.6, render: (r) => `${r.star}` },
          { key: 'sp', title: 'Spinel', align: 'right', render: (r) => fmtFull(r.spinel) },
          { key: 'cr', title: 'Crystal', align: 'right', render: (r) => fmtFull(r.crystal) },
          { key: 'u', title: 'Unlocks', flex: 2, render: (r) => r.unlocks },
        ]}
        highlight={(r) => r.star > from && r.star <= to}
      />
      <SectionHeader title="Curio encyclopedia" />
      {curios.map((k) => (
        <Card key={k.id} style={{ marginBottom: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{k.name}</Text>
            {k.heroId ? <Badge label={seedHeroes.find((h) => h.id === k.heroId)?.name ?? k.heroId} color={palette.gold} /> : <Badge label="Universal" />}
          </Row>
          <Text style={[type.bodySecondary, { marginTop: 4 }]}>Legion passive: {k.legionPassive}</Text>
          <Text style={type.bodySecondary}>Hero attribute: {k.heroAttribute}</Text>
          {k.exclusivePassive ? <Text style={[type.bodySecondary, { color: palette.gold }]}>Exclusive: {k.exclusivePassive}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
