import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import type { Element, Hero, Rarity, UnitType } from '@/types/game';
import { listHeroes } from '@/db/repo';
import { bondGifts, bondGroups, bondLevels, curioStarCosts, heroCurios, heroes as seedHeroes, troopTriangle } from '@/data/seed';
import { elementColors, palette, rarityColors, space, troopColors, type } from '@/theme';
import { Badge, Card, Chip, ChipRow, CollapsibleSection, ElementEmblem, EmptyState, Field, NumberField, Row, Screen, SectionHeader, Segmented, Stat, Table, TroopEmblem } from '@/components/ui';
import { HeroCard } from '@/components/domain/HeroCard';
import { ElementWheel, TroopTriangle } from '@/components/domain/CounterVisualizers';
import { useAppStore } from '@/store/useAppStore';
import { bondExpBetween, bondGiftPlan, curioCost, fmtFull } from '@/lib/calculators';
import { civilBonuses, clampEntry, enhancementLabel, promotionStatus, requiredEnhancementForBond, type CivilBonus } from '@/lib/roster';

const ELEMENTS: Element[] = ['Fire', 'Ice', 'Nature', 'Light', 'Dark'];
const RARITIES: Rarity[] = [6, 5, 4, 3, 2];
const UNITS: UnitType[] = ['Infantry', 'Cavalry', 'Archer', 'All-round', 'Civil'];
const VIEWS = ['Codex', 'Mine', 'Reference'] as const;

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function HeroesScreen() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Codex');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs }}>
        <Segmented options={VIEWS} value={view} onChange={setView} labels={{ Mine: 'Roster' }} />
      </View>
      {view === 'Codex' ? <Codex /> : view === 'Mine' ? <MyHeroes onBrowse={() => setView('Codex')} /> : <Reference />}
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
  const roster = useAppStore((s) => s.roster);
  const [own, setOwn] = useState<'all' | 'owned' | 'missing'>('all');

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      listHeroes({ query: q.trim() || undefined, elements: els, rarities: rars, unitTypes: units })
        .then((r) => { if (alive) setRows(r); })
        .catch(() => { if (alive) setRows([]); });
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [q, els, rars, units]);

  const sorted = useMemo(() => {
    const filtered = own === 'all' ? rows : rows.filter((h) => (own === 'owned') === !!roster[h.id]);
    return focus === 'All' ? filtered : [...filtered].sort((a, b) => Number(b.unitType === focus) - Number(a.unitType === focus));
  }, [rows, focus, own, roster]);

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
            <Chip label="Owned" active={own === 'owned'} color={palette.success} onPress={() => setOwn(own === 'owned' ? 'all' : 'owned')} />
            <Chip label="Missing" active={own === 'missing'} onPress={() => setOwn(own === 'missing' ? 'all' : 'missing')} />
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
          <HeroCard hero={item} focus={focus} owned={roster[item.id] ? clampEntry(item, roster[item.id]) : undefined} onPress={() => router.push(`/hero/${item.id}`)} />
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No heroes match" body="Clear a filter or try a shorter search." />}
    />
  );
}

const signed = (n: number, text: string) => (n < 0 ? `-${text.replace('-', '')}` : `+${text}`);
const BONUS_UNIT = (b: CivilBonus) => (b.value === null ? '' : b.unit === '%' ? `${signed(b.value, String(b.value))}%` : b.unit === 'min' ? `${b.value} min` : signed(b.value, fmtFull(b.value)));

function MyHeroes({ onBrowse }: { onBrowse: () => void }) {
  const roster = useAppStore((s) => s.roster);
  const focus = useAppStore((s) => s.troopFocus);
  const owned = seedHeroes.filter((h) => roster[h.id]).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  const bonuses = civilBonuses(owned, roster);
  const troopCap = bonuses.filter((b) => b.active && b.stat === 'troopCap' && b.value !== null).reduce((s, b) => s + b.value!, 0);
  const promotable = owned.filter((h) => promotionStatus(h, clampEntry(h, roster[h.id])).eligible);
  const byUnit = (['Infantry', 'Cavalry', 'Archer', 'All-round', 'Civil'] as UnitType[]).map((u) => ({ u, n: owned.filter((h) => h.unitType === u).length }));

  if (!owned.length) {
    return (
      <Screen>
        <EmptyState title="No heroes added yet" body="Open any hero in the Codex and tap “I own this hero” to start your roster." />
        <View style={{ alignItems: 'center' }}><Chip label="Browse the Codex" onPress={onBrowse} /></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ marginTop: space.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Heroes owned" value={`${owned.length} / ${seedHeroes.length}`} color={palette.cyan} />
          <Stat label="6★ heroes" value={String(owned.filter((h) => clampEntry(h, roster[h.id]).stars === 6).length)} align="right" />
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.md }}>
          {byUnit.filter((x) => x.n).map((x) => <Badge key={x.u} label={`${x.u} ${x.n}`} color={troopColors[x.u]} />)}
        </View>
      </Card>

      {promotable.length ? (
        <>
          <SectionHeader title="Ready to promote to 6★" />
          <ChipRow>{promotable.map((h) => <Chip key={h.id} label={h.name} color={palette.gold} active onPress={() => router.push(`/hero/${h.id}`)} />)}</ChipRow>
        </>
      ) : null}

      <CollapsibleSection title="Civil bonuses from your heroes" subtitle={troopCap ? `Known troop capacity: +${fmtFull(troopCap)}` : 'Own-only skills, active without marching'} right={<Badge label={String(bonuses.length)} color={palette.gold} />} initiallyOpen={false}>
      {bonuses.length ? (
        <Card style={{ paddingVertical: space.sm }}>
          {bonuses.map((b, i) => (
            <Row key={`${b.heroId}-${b.skill}`} style={{ paddingVertical: 6, alignItems: 'flex-start', borderTopWidth: i ? 1 : 0, borderTopColor: palette.border }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.body, !b.active && { color: palette.textMuted }]}>{b.skill}</Text>
                <Text style={type.caption}>{b.hero} · {b.note}</Text>
              </View>
              <Text style={[type.number, { color: b.active && b.value !== null ? palette.gold : palette.textMuted }]}>{b.active ? BONUS_UNIT(b) || '—' : 'Locked'}</Text>
            </Row>
          ))}
        </Card>
      ) : (
        <Card><Text style={type.bodySecondary}>None of your heroes have civil skills yet.</Text></Card>
      )}
      </CollapsibleSection>

      <SectionHeader title="Your heroes" subtitle="Tap a hero to update stars, level, enhancement and bond" />
      {owned.map((h) => (
        <HeroCard key={h.id} hero={h} focus={focus} owned={clampEntry(h, roster[h.id])} onPress={() => router.push(`/hero/${h.id}`)} />
      ))}
      <Text style={[type.caption, { marginTop: space.sm }]}>Bonuses show — where the wiki doesn't list a value for that enhancement level, and those are left out of the troop capacity total.</Text>
    </Screen>
  );
}

/** Reference tables in one place, each folded. */
function Reference() {
  return (
    <Screen>
      <CollapsibleSection title="Matchups" subtitle="Element wheel, troop triangle, formations" initiallyOpen={false}><Counters /></CollapsibleSection>
      <CollapsibleSection title="Bonds" subtitle="Bond EXP planner, gifts, bond groups" initiallyOpen={false}><Bonds /></CollapsibleSection>
      <CollapsibleSection title="Curios" subtitle="Ascend calculator, star costs, encyclopedia" initiallyOpen={false}><Curios /></CollapsibleSection>
    </Screen>
  );
}

function Counters() {
  return (
    <>
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
    </>
  );
}

function Bonds() {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(30);
  const roster = useAppStore((s) => s.roster);
  const [heroId, setHeroId] = useState<string | null>(null);
  const ownedHeroes = seedHeroes.filter((h) => roster[h.id]);
  const picked = heroId ? seedHeroes.find((h) => h.id === heroId) : undefined;
  const pickedEntry = picked && roster[picked.id] ? clampEntry(picked, roster[picked.id]) : undefined;
  const [owned, setOwned] = useState<Record<number, number>>({});
  const f = Math.min(Math.max(1, from), bondLevels.length);
  const t = Math.min(Math.max(f, to), bondLevels.length);
  const need = bondExpBetween(bondLevels, f, t);
  const plan = bondGiftPlan(bondGifts, owned, need);
  const ownedExp = bondGifts.reduce((s, g) => s + (owned[g.tier] ?? 0) * g.exp, 0);
  const nameOf = (id: string) => seedHeroes.find((h) => h.id === id)?.name ?? id;
  return (
    <>
      <SectionHeader title="Bond EXP planner" subtitle="Lv. 1–95 · Lv. 1 and Lv. 95 EXP from the wiki, levels between estimated" />
      {ownedHeroes.length ? (
        <ChipRow>
          {ownedHeroes.map((h) => (
            <Chip key={h.id} label={h.name} active={h.id === heroId} onPress={() => {
              if (h.id === heroId) { setHeroId(null); return; }
              setHeroId(h.id);
              const e = clampEntry(h, roster[h.id]);
              setFrom(e.bond);
              setTo(Math.min(bondLevels.length, e.bond + 10));
            }} />
          ))}
        </ChipRow>
      ) : null}
      <Card>
        <Row>
          <NumberField label="Current level" value={from} onChange={setFrom} />
          <NumberField label="Target level" value={to} onChange={setTo} />
        </Row>
        <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
          <Stat label="EXP needed" value={fmtFull(need)} color={palette.cyan} />
          <Stat label="EXP in bag" value={fmtFull(ownedExp)} align="right" color={ownedExp >= need ? palette.success : palette.gold} />
        </Row>
        {pickedEntry && requiredEnhancementForBond(t) !== null && pickedEntry.enhancement < requiredEnhancementForBond(t)! ? (
          <Text style={[type.caption, { marginTop: space.sm, color: palette.danger }]}>
            {picked!.name} is {enhancementLabel(pickedEntry.enhancement)}; bond Lv. {t} needs {enhancementLabel(requiredEnhancementForBond(t)!)} enhancement.
          </Text>
        ) : null}
        <Text style={[type.caption, { marginTop: space.sm }]}>Lv. {f}{bondLevels[f - 1]?.title ? ` ${bondLevels[f - 1]!.title}` : ''} → Lv. {t}{bondLevels[t - 1]?.title ? ` ${bondLevels[t - 1]!.title}` : ''}</Text>
      </Card>
      <SectionHeader title="Bond gifts in bag" />
      <Card>
        {bondGifts.map((g) => (
          <Row key={g.tier} style={{ marginBottom: space.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={type.body}>T{g.tier} {g.name}</Text>
              <Text style={type.caption}>{fmtFull(g.exp)} EXP each{g.sameElementExp ? ` · ${fmtFull(g.sameElementExp)} to a same-element hero` : ''}</Text>
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
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[type.heading, { flex: 1 }]}>{g.name}</Text>
            {g.verified === false || g.bonusesVerified === false ? <Badge label={g.verified === false ? 'Not verified' : 'Bonuses not verified'} color={palette.textMuted} /> : null}
          </Row>
          <Text style={[type.caption, { marginTop: 2 }]}>{[...g.members.map(nameOf), ...(g.otherMembers ?? [])].join(' · ')}</Text>
          <View style={{ marginTop: space.sm, gap: 4 }}>
            {g.bonuses.map((b, i) => (
              <Row key={i}>{b.level > 0 ? <Badge label={`Lv. ${b.level}`} color={palette.gold} /> : null}<Text style={[type.bodySecondary, { flex: 1 }]}>{b.effect}</Text></Row>
            ))}
          </View>
        </Card>
      ))}
    </>
  );
}

function Curios() {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(5);
  const c = curioCost(curioStarCosts, Math.min(from, 10), Math.min(Math.max(from, to), 10));
  return (
    <>
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
      <Text style={[type.caption, { marginBottom: space.sm }]}>Exclusive curios from the community wiki (matches the game). Legendary values shown; open a hero for every quality.</Text>
      {heroCurios.map((k) => {
        const owner = seedHeroes.find((h) => h.id === k.heroId);
        return (
          <Card key={k.id} style={{ marginBottom: space.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[type.heading, { flex: 1 }]} noTranslate>{k.name}</Text>
              <Badge label={owner?.name ?? k.heroName} color={palette.gold} />
            </Row>
            <Text style={[type.bodySecondary, { marginTop: 4 }]} noTranslate>
              {k.exclusive.map((a) => `${a.name} +${a.values[4] ?? '—'}${a.unit === '%' ? '%' : ''}`).join(' · ')}
            </Text>
          </Card>
        );
      })}
    </>
  );
}
