import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import type { TroopFocus, UpgradeCostRow } from '@/types/game';
import {
  buildings, citadelLevels, dragonExpItems, dragonLair, draconicStones, gearSlots, gearStages, gloryBuildings, holystoneSets, runeExtras, runeSets,
  totemEnergyTiers, totemSets, upgradeTable,
} from '@/data/seed';
import { palette, space, troopColors, type } from '@/theme';
import { Accordion, Badge, Button, Card, Chip, ChipRow, ConfidenceNote, NumberField, Row, Screen, SectionHeader, Stat, Table, TroopEmblem } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { fmt, fmtFull } from '@/lib/calculators';
import { formatDurationShort } from '@/lib/time';

const VIEWS = ['Citadel', 'Gear', 'Runes', 'Totems', 'Holystones', 'Dragon', 'Glory'] as const;
type View_ = (typeof VIEWS)[number];

const relevant = (focus: TroopFocus, f: TroopFocus | string) => focus === 'All' || f === focus || f === 'All';

export default function ProgressionScreen() {
  const [view, setView] = useState<View_>('Citadel');
  const focus = useAppStore((s) => s.troopFocus);
  return (
    <Screen sticky={<View style={{ backgroundColor: palette.bg }}><ChipRow>{VIEWS.map((v) => <Chip key={v} label={v} active={v === view} onPress={() => setView(v)} />)}</ChipRow></View>}>
      {focus !== 'All' ? (
        <Row style={{ marginTop: space.xs }}><TroopEmblem type={focus} size={16} /><Text style={type.caption}>Highlighting upgrades for {focus} mains</Text></Row>
      ) : null}
      {view === 'Citadel' && <CitadelView />}
      {view === 'Gear' && <GearView focus={focus} />}
      {view === 'Runes' && <RunesView focus={focus} />}
      {view === 'Totems' && <TotemsView focus={focus} />}
      {view === 'Holystones' && <HolystonesView />}
      {view === 'Dragon' && <DragonView focus={focus} />}
      {view === 'Glory' && <GloryView focus={focus} />}
    </Screen>
  );
}

function CostTable({ rows }: { rows: UpgradeCostRow[] }) {
  const bands = [0, 10, 20, 30].map((s) => rows.slice(s, s + 10));
  return (
    <>
      {bands.map((band) => (
        <Accordion key={band[0]!.level} title={`Levels ${band[0]!.level}–${band[band.length - 1]!.level}`} subtitle={`Essence total ${fmtFull(band.reduce((s, r) => s + r.essence, 0))}`}>
          <Table
            rows={band}
            columns={[
              { key: 'l', title: 'Lv', flex: 0.5, render: (r) => String(r.level) },
              { key: 'e', title: 'Essence', align: 'right', render: (r) => fmtFull(r.essence) },
              { key: 's', title: 'Spinel', align: 'right', render: (r) => (r.spinel ? fmtFull(r.spinel) : '—') },
              { key: 'c', title: 'Crystal', align: 'right', render: (r) => (r.crystal ? fmtFull(r.crystal) : '—') },
              { key: 'a', title: 'Core', align: 'right', flex: 0.7, render: (r) => (r.arcaneCore ? String(r.arcaneCore) : '—') },
            ]}
          />
        </Accordion>
      ))}
      <ConfidenceNote confidence="estimate" />
    </>
  );
}

function CitadelView() {
  return (
    <>
      <SectionHeader title="Citadel Lv. 1–40" subtitle="Reverse dependency tree and costs" right={<Button compact icon={Calculator} label="Planner" onPress={() => router.push('/tools/citadel')} />} />
      {citadelLevels.map((l) => (
        <Accordion key={l.level} title={`Citadel ${l.level}`} subtitle={l.unlocks.length ? `Unlocks: ${l.unlocks.join(', ')}` : l.requires.map((r) => `${r.building} ${r.level}`).join(' · ') || 'Starting level'} accent={l.unlocks.length ? palette.gold : undefined}>
          {l.requires.length ? (
            <>
              <Text style={[type.caption, { marginBottom: 4 }]}>Requires</Text>
              {l.requires.map((r) => <Text key={r.building} style={type.body}>{r.building} Lv. {r.level}</Text>)}
            </>
          ) : null}
          <Text style={[type.caption, { marginTop: space.md, marginBottom: 4 }]}>Cost · base time {l.baseSeconds === null ? 'unknown' : formatDurationShort(l.baseSeconds)}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            {Object.entries(l.cost).filter(([, v]) => v).map(([k, v]) => <Stat key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} value={fmt(v as number)} />)}
          </View>
        </Accordion>
      ))}
      <ConfidenceNote confidence="community" />
      <SectionHeader title="Building directory" />
      {buildings.map((b) => (
        <Card key={b.id} style={{ marginBottom: space.sm, padding: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{b.name}</Text>
            <Text style={type.numberSmall}>Citadel {b.unlockCitadel}+</Text>
          </Row>
          <Text style={type.bodySecondary}>{b.purpose}</Text>
          {b.gloryStat ? <Text style={[type.caption, { color: palette.gold, marginTop: 2 }]}>Glory: {b.gloryStat}</Text> : null}
        </Card>
      ))}
    </>
  );
}

function GearView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('gear'), []);
  return (
    <>
      <SectionHeader title="Gear stat mapping" subtitle="6 slots with asymmetric ATK / DEF-HP lines" />
      {gearSlots.map((g) => {
        const hl = focus !== 'All' && (g.attack === focus || g.defense === focus);
        return (
          <Card key={g.slot} style={{ marginBottom: space.sm, padding: space.md, opacity: focus === 'All' || hl ? 1 : 0.5 }} accent={hl ? troopColors[focus] : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={type.heading}>{g.slot}</Text>
              {g.attack === focus ? <Badge label="Your ATK slot" color={troopColors[focus]} /> : null}
            </Row>
            <Row style={{ marginTop: 6 }}>
              <TroopEmblem type={g.attack} size={16} /><Text style={type.body}>{g.attack} ATK</Text>
              <Text style={type.caption}>·</Text>
              <TroopEmblem type={g.defense} size={16} /><Text style={type.body}>{g.defense} DEF / HP</Text>
            </Row>
          </Card>
        );
      })}
      <SectionHeader title="Upgrade stages" />
      {gearStages.map((s) => (
        <Card key={s.name} style={{ marginBottom: space.sm, padding: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={type.heading}>{s.name}</Text><Badge label={s.material} color={palette.cyan} /></Row>
          <Text style={[type.bodySecondary, { marginTop: 4 }]}>{s.description}</Text>
        </Card>
      ))}
      <SectionHeader title="Enhancement cost (per piece)" />
      <CostTable rows={rows} />
    </>
  );
}

function RunesView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('rune'), []);
  return (
    <>
      <SectionHeader title="Rune sets" subtitle="6 sets × 4 runes = 24 runes" />
      {runeSets.map((r) => (
        <Card key={r.name} style={{ marginBottom: space.sm, padding: space.md, opacity: relevant(focus, r.focus) ? 1 : 0.5 }} accent={relevant(focus, r.focus) && focus !== 'All' ? troopColors[r.focus] : undefined}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{r.name}</Text>
            <Row gap={4}><TroopEmblem type={r.focus} size={16} /><Text style={type.caption}>{r.focus}</Text></Row>
          </Row>
          <Text style={[type.bodySecondary, { marginTop: 4 }]}>{r.stats.join(' · ')}</Text>
        </Card>
      ))}
      {runeExtras.map((x) => (
        <Card key={x.name} style={{ marginBottom: space.sm, padding: space.md }}><Text style={type.heading}>{x.name}</Text><Text style={type.bodySecondary}>{x.detail}</Text></Card>
      ))}
      <SectionHeader title="Rune upgrade cost" />
      <CostTable rows={rows} />
    </>
  );
}

function TotemsView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('totem'), []);
  const col = focus === 'Infantry' ? 'bear' : focus === 'Archer' ? 'eagle' : focus === 'Cavalry' ? 'wolf' : null;
  return (
    <>
      <SectionHeader title="Totem sets I–V" subtitle="Weapon Forge Lv. 16–31 · Bear (Inf) · Eagle (Arch) · Wolf (Cav)" />
      <Table
        rows={totemSets}
        columns={[
          { key: 's', title: 'Set', flex: 0.5, render: (r) => r.set },
          { key: 'f', title: 'Forge', flex: 0.6, render: (r) => `Lv. ${r.forgeLevel}` },
          { key: 'b', title: 'Bear', render: (r) => r.bear, color: () => (col === 'bear' ? troopColors.Infantry : undefined) },
          { key: 'e', title: 'Eagle', render: (r) => r.eagle, color: () => (col === 'eagle' ? troopColors.Archer : undefined) },
          { key: 'w', title: 'Wolf', render: (r) => r.wolf, color: () => (col === 'wolf' ? troopColors.Cavalry : undefined) },
        ]}
      />
      <SectionHeader title="Energy Stone modification tiers" />
      <Card>{totemEnergyTiers.map((t) => <Text key={t} style={[type.body, { marginBottom: 4 }]}>{t}</Text>)}</Card>
      <SectionHeader title="Totem upgrade cost" />
      <CostTable rows={rows} />
    </>
  );
}

function HolystonesView() {
  const rows = useMemo(() => upgradeTable('holystone'), []);
  return (
    <>
      <SectionHeader title="Holystone sets I–IV" subtitle="Weapon Forge Lv. 25–31 · unit + troop dual scaling" />
      <Table
        rows={holystoneSets}
        columns={[
          { key: 's', title: 'Set', flex: 0.5, render: (r) => r.set },
          { key: 'f', title: 'Forge', flex: 0.6, render: (r) => `Lv. ${r.forgeLevel}` },
          { key: 'u', title: 'Unit stat', render: (r) => r.unitStat },
          { key: 't', title: 'Troop stat', render: (r) => r.troopStat },
        ]}
      />
      <SectionHeader title="Holystone upgrade cost" />
      <CostTable rows={rows} />
    </>
  );
}

function DragonView({ focus }: { focus: TroopFocus }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const total = dragonExpItems.reduce((s, i) => s + (counts[i.name] ?? 0) * i.exp, 0);
  return (
    <>
      <SectionHeader title="Draconic Stones" subtitle="Dragon Lv. 30 / 40 / 50 unlocks" />
      {draconicStones.map((d) => (
        <Card key={d.name} style={{ marginBottom: space.sm, padding: space.md, opacity: relevant(focus, d.focus) ? 1 : 0.5 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{d.name}</Text>
            <Badge label={`Dragon Lv. ${d.dragonLevel}`} color={d.dragonLevel === 50 ? palette.gold : palette.cyan} />
          </Row>
          <Text style={type.bodySecondary}>{d.effect}</Text>
        </Card>
      ))}
      <SectionHeader title="Holy Water & shard EXP worth" />
      <Card>
        {dragonExpItems.map((i) => (
          <Row key={i.name} style={{ marginBottom: space.sm }}>
            <View style={{ flex: 1 }}><Text style={type.body}>{i.name}</Text><Text style={type.caption}>{fmtFull(i.exp)} EXP</Text></View>
            <NumberField value={counts[i.name] ?? 0} onChange={(n) => setCounts({ ...counts, [i.name]: n })} width={100} />
          </Row>
        ))}
        <Stat label="Total Dragon EXP" value={fmtFull(total)} color={palette.cyan} />
      </Card>
      <SectionHeader title="Dragon's Lair cost reduction" subtitle="Military and civil construction" />
      <Accordion title="Lair Lv. 1–40" subtitle="-0.5% to -20%">
        <Table rows={dragonLair} columns={[
          { key: 'l', title: 'Lair Lv', render: (r) => String(r.level) },
          { key: 'm', title: 'Military', align: 'right', render: (r) => `-${r.militaryReduction.toFixed(1)}%` },
          { key: 'c', title: 'Civil', align: 'right', render: (r) => `-${r.civilReduction.toFixed(1)}%` },
        ]} />
      </Accordion>
    </>
  );
}

function GloryView({ focus }: { focus: TroopFocus }) {
  const rows = [...gloryBuildings].sort((a, b) => Number(relevant(focus, b.focus) && b.focus !== 'All') - Number(relevant(focus, a.focus) && a.focus !== 'All'));
  return (
    <>
      <SectionHeader title="Building Glory levels" subtitle="Unlock at building Lv. 15 · Marks of Glory" />
      {rows.map((g) => (
        <Card key={g.building} style={{ marginBottom: space.sm, padding: space.md, opacity: relevant(focus, g.focus) ? 1 : 0.5 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{g.building}</Text>
            <Row gap={4}><TroopEmblem type={g.focus} size={16} /><Text style={[type.body, { color: troopColors[g.focus] }]}>{g.stat}</Text></Row>
          </Row>
        </Card>
      ))}
    </>
  );
}
