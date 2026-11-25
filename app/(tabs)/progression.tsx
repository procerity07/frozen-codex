import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Calculator, HeartPulse } from 'lucide-react-native';
import type { TroopFocus, UpgradeCostRow } from '@/types/game';
import {
  buildings, citadelLevels, dragonExpItems, dragonLair, draconicStones, gearSlots, gearStages, gloryBuildings, holystoneNotes, holystoneSets, runeExtras, runeSets,
  totemEnergyTiers, totemSets, upgradeTable,
} from '@/data/seed';
import { palette, space, troopColors, type } from '@/theme';
import { Accordion, Badge, Button, Card, Chip, ChipRow, CollapsibleSection, ConfidenceNote, NumberField, Row, Screen, SectionHeader, Stat, Table, TroopEmblem } from '@/components/ui';
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
    <Screen sticky={<View style={{ backgroundColor: palette.bg }}><Row style={{ marginTop: space.sm }}><View style={{ flex: 1 }}><Button compact variant="secondary" icon={Calculator} label="Citadel Planner" onPress={() => router.push('/tools/citadel')} /></View><View style={{ flex: 1 }}><Button compact variant="secondary" icon={HeartPulse} label="Troop Training" onPress={() => router.push('/tools/casualty')} /></View></Row><ChipRow>{VIEWS.map((v) => <Chip key={v} label={v} active={v === view} onPress={() => setView(v)} />)}</ChipRow></View>}>
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
      <CollapsibleSection title="Citadel Lv. 1–40" subtitle="Reverse dependency tree and costs" right={<Button compact icon={Calculator} label="Planner" onPress={() => router.push('/tools/citadel')} />}>
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
      </CollapsibleSection>
      <CollapsibleSection title="Building directory" initiallyOpen={false}>
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
      </CollapsibleSection>
    </>
  );
}

function GearView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('gear'), []);
  return (
    <>
      <CollapsibleSection title="Gear stat mapping" subtitle="6 slots with asymmetric ATK / DEF-HP lines">
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
      </CollapsibleSection>
      <CollapsibleSection title="Upgrade stages" initiallyOpen={false}>
      {gearStages.map((s) => (
        <Card key={s.name} style={{ marginBottom: space.sm, padding: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={type.heading}>{s.name}</Text><Badge label={s.material} color={palette.cyan} /></Row>
          <Text style={[type.bodySecondary, { marginTop: 4 }]}>{s.description}</Text>
        </Card>
      ))}
      </CollapsibleSection>
      <CollapsibleSection title="Enhancement cost (per piece)" initiallyOpen={false}>
      <CostTable rows={rows} />
      </CollapsibleSection>
    </>
  );
}

function RunesView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('rune'), []);
  return (
    <>
      <CollapsibleSection title="Rune types" subtitle="4 types · up to 6 sets of 4 runes · Weapon Forge Lv. 8">
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
      </CollapsibleSection>
      <CollapsibleSection title="Rune upgrade cost" initiallyOpen={false}>
      <CostTable rows={rows} />
      </CollapsibleSection>
    </>
  );
}

function TotemsView({ focus }: { focus: TroopFocus }) {
  const rows = useMemo(() => upgradeTable('totem'), []);
  const col = focus === 'Infantry' ? 'bear' : focus === 'Archer' ? 'eagle' : focus === 'Cavalry' ? 'wolf' : null;
  return (
    <>
      <CollapsibleSection title="Totem sets I–V" subtitle="Weapon Forge Lv. 16–31 · Bear (Inf) · Eagle (Arch) · Wolf (Cav)">
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
      </CollapsibleSection>
      <CollapsibleSection title="Totem bonuses" initiallyOpen={false}>
      <Card>{totemEnergyTiers.map((t) => <Text key={t} style={[type.body, { marginBottom: 4 }]}>{t}</Text>)}</Card>
      </CollapsibleSection>
      <CollapsibleSection title="Totem upgrade cost" initiallyOpen={false}>
      <CostTable rows={rows} />
      </CollapsibleSection>
    </>
  );
}

function HolystonesView() {
  const rows = useMemo(() => upgradeTable('holystone'), []);
  return (
    <>
      <CollapsibleSection title="Holystone sets I–IV" subtitle="Weapon Forge Lv. 25–31 · unit + troop dual scaling">
      <Table
        rows={holystoneSets}
        columns={[
          { key: 's', title: 'Set', flex: 0.5, render: (r) => r.set },
          { key: 'f', title: 'Forge', flex: 0.6, render: (r) => `Lv. ${r.forgeLevel}` },
          { key: 'u', title: 'Unit stat', render: (r) => r.unitStat },
          { key: 't', title: 'Troop stat', render: (r) => r.troopStat },
        ]}
      />
      <Card style={{ marginTop: space.sm }}>{holystoneNotes.map((n) => <Text key={n} style={[type.bodySecondary, { marginBottom: 4 }]}>{n}</Text>)}</Card>
      </CollapsibleSection>
      <CollapsibleSection title="Holystone upgrade cost" initiallyOpen={false}>
      <CostTable rows={rows} />
      </CollapsibleSection>
    </>
  );
}

function DragonView({ focus }: { focus: TroopFocus }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const total = dragonExpItems.reduce((s, i) => s + (counts[i.name] ?? 0) * i.exp, 0);
  return (
    <>
      <CollapsibleSection title="Draconic Stones" subtitle="Dragon Lv. 30 / 40 / 50 unlocks">
      {draconicStones.map((d) => (
        <Card key={d.name} style={{ marginBottom: space.sm, padding: space.md, opacity: relevant(focus, d.focus) ? 1 : 0.5 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{d.name}</Text>
            <Badge label={`Dragon Lv. ${d.dragonLevel}`} color={d.dragonLevel === 50 ? palette.gold : palette.cyan} />
          </Row>
          <Text style={type.bodySecondary}>{d.effect}</Text>
        </Card>
      ))}
      </CollapsibleSection>
      <CollapsibleSection title="Holy Water & shard EXP worth" initiallyOpen={false}>
      <Card>
        {dragonExpItems.map((i) => (
          <Row key={i.name} style={{ marginBottom: space.sm }}>
            <View style={{ flex: 1 }}><Text style={type.body}>{i.name}</Text><Text style={type.caption}>{fmtFull(i.exp)} EXP</Text></View>
            <NumberField value={counts[i.name] ?? 0} onChange={(n) => setCounts({ ...counts, [i.name]: n })} width={100} />
          </Row>
        ))}
        <Stat label="Total Dragon EXP" value={fmtFull(total)} color={palette.cyan} />
      </Card>
      </CollapsibleSection>
      <CollapsibleSection title="Dragon's Lair cost reduction" subtitle="Unlocks at Chapter 4 · per-level values not verified" initiallyOpen={false}>
      <Accordion title="Lair Lv. 1–40" subtitle="-0.5% to -20%">
        <Table rows={dragonLair} columns={[
          { key: 'l', title: 'Lair Lv', render: (r) => String(r.level) },
          { key: 'm', title: 'Military', align: 'right', render: (r) => `-${r.militaryReduction.toFixed(1)}%` },
          { key: 'c', title: 'Civil', align: 'right', render: (r) => `-${r.civilReduction.toFixed(1)}%` },
        ]} />
      </Accordion>
      </CollapsibleSection>
    </>
  );
}

function GloryView({ focus }: { focus: TroopFocus }) {
  const rows = [...gloryBuildings].sort((a, b) => Number(relevant(focus, b.focus) && b.focus !== 'All') - Number(relevant(focus, a.focus) && a.focus !== 'All'));
  return (
    <>
      <CollapsibleSection title="Building Glory levels" subtitle="Unlock at building Lv. 15 · Marks of Glory">
      {rows.map((g) => (
        <Card key={g.building} style={{ marginBottom: space.sm, padding: space.md, opacity: relevant(focus, g.focus) ? 1 : 0.5 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={type.heading}>{g.building}</Text>
            {g.verified === false ? (
              <Badge label={g.stat} color={palette.textMuted} />
            ) : (
              <Row gap={4}><TroopEmblem type={g.focus} size={16} /><Text style={[type.body, { color: troopColors[g.focus] }]}>{g.stat}</Text></Row>
            )}
          </Row>
        </Card>
      ))}
      </CollapsibleSection>
    </>
  );
}
