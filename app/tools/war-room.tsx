import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, LayoutGrid } from 'lucide-react-native';
import { palette, radius, space, type } from '@/theme';
import { Badge, Button, Card, Chip, ChipRow, Field, NumberField, Row, Screen, SectionHeader, Segmented, Stat, Table } from '@/components/ui';
import { colExchange, COL_PERSONAL_TARGET, fmtFull, reKillPoints, reKillPointsByTier, troopPowerByTier } from '@/lib/calculators';
import { mailTemplates, type MailFormat } from '@/lib/mailTemplates';

const VIEWS = ['Compare', 'CoL Calc', 'RE Points', 'Mail'] as const;

const WARS = [
  {
    name: 'Conquest of Lords', color: palette.gold, rows: [
      ['When', 'Sat 10:00 UTC · 24h · Ace Lord Week'], ['Win', 'Hall of Might 8h straight, else longest hold'], ['Hazards', 'Spire cannon every 10 min: 1% garrison loss'],
      ['Safety', 'Enchanted Woodland immunity'], ['Deaths', '30% structure losses are permanent'], ['Score', '1M lost = 400 · 1M killed = 100 · target 12k'],
    ],
  },
  {
    name: 'Realm Expedition', color: palette.cyan, rows: [
      ['When', 'Sat 10:00 UTC · 24h · Arms Race Week'], ['Win', 'Realm ranking by kills & pillage'], ['Hazards', 'Cross-realm teleport invasions'],
      ['Safety', 'Realm Hospital protects wounded'], ['Deaths', 'Wounded protected by Realm Hospital'], ['Score', 'T1 = 0 · T2 = 1 … T11 = 80 · T12 = 100 · Diamond Mine cap 8,000'],
    ],
  },
  {
    name: 'Scorching Front', color: palette.danger, rows: [
      ['When', 'Weekly Sun/Mon · single sign-up session'], ['Win', 'Most Fire Crystals'], ['Hazards', 'Teleports: 3 free, then rising diamond cost'],
      ['Safety', 'Goblin Shield pickups'], ['Deaths', 'Realm Hospital fully heals free after event'], ['Score', '1 Fire Crystal = 1 point · central supply chests'],
    ],
  },
];

export default function WarRoom() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Compare');
  return (
    <Screen sticky={<View style={{ paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: palette.bg }}><Segmented options={VIEWS} value={view} onChange={setView} /></View>}>
      <Stack.Screen options={{ title: 'War Room' }} />
      <Card style={{ marginBottom: space.md }}>
        <Text style={type.heading}>Alliance Hive Planner</Text>
        <Text style={[type.caption, { marginTop: 2 }]}>Plan where every member's castle goes around the fort, with teleport coordinates for each spot.</Text>
        <View style={{ marginTop: space.sm }}><Button icon={LayoutGrid} variant="secondary" label="Open Hive Planner" onPress={() => router.push('/tools/hive')} /></View>
      </Card>
      {view === 'Compare' && <Compare />}
      {view === 'CoL Calc' && <ColCalc />}
      {view === 'RE Points' && <RePoints />}
      {view === 'Mail' && <MailGen />}
    </Screen>
  );
}

function Compare() {
  return (
    <>
      {WARS.map((w) => (
        <Card key={w.name} style={{ marginTop: space.md }} accent={w.color}>
          <Text style={[type.title, { color: w.color }]}>{w.name}</Text>
          {w.rows.map(([k, v]) => (
            <Row key={k} style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
              <Text style={[type.caption, { width: 64 }]}>{k}</Text>
              <Text style={[type.body, { flex: 1 }]}>{v}</Text>
            </Row>
          ))}
        </Card>
      ))}
    </>
  );
}

function ColCalc() {
  const [target, setTarget] = useState(COL_PERSONAL_TARGET);
  const [tier, setTier] = useState(10);
  const [mode, setMode] = useState<'lost' | 'killed'>('lost');
  const r = colExchange(target, tier, mode);
  return (
    <>
      <SectionHeader title="Point exchange tile calculator" subtitle="Troops needed for an agreed trade" />
      <Card>
        <Segmented options={['lost', 'killed'] as const} value={mode} onChange={setMode} labels={{ lost: 'Power lost (400 / 1M)', killed: 'Power killed (100 / 1M)' }} />
        <View style={{ marginTop: space.md }}><NumberField label="Target points" value={target} onChange={setTarget} /></View>
        <Text style={[type.caption, { marginTop: space.md }]}>Troop tier</Text>
      </Card>
      <ChipRow>{troopPowerByTier.map((_, i) => <Chip key={i} label={`T${i + 1}`} active={tier === i + 1} onPress={() => setTier(i + 1)} />)}</ChipRow>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Power required" value={fmtFull(r.powerNeeded)} />
          <Stat label={`T${tier} troops`} value={fmtFull(r.troopsNeeded)} color={palette.cyan} align="right" />
        </Row>
        <Text style={[type.caption, { marginTop: space.sm }]}>{r.pointsPerTroop.toFixed(4)} pts per T{tier} troop · power per troop {troopPowerByTier[tier - 1]} (estimate)</Text>
        {target !== COL_PERSONAL_TARGET ? null : <View style={{ marginTop: space.sm }}><Badge label="12,000 = personal milestone" color={palette.gold} /></View>}
      </Card>
    </>
  );
}

function RePoints() {
  const [kills, setKills] = useState<number[]>(Array(12).fill(0));
  const total = reKillPoints(kills);
  return (
    <>
      <SectionHeader title="Realm Expedition kill points" subtitle="Foreign troops only" />
      <Card>
        <Stat label="Total points" value={fmtFull(total)} color={palette.cyan} />
        {kills.map((k, i) => (
          <Row key={i} style={{ marginTop: space.sm }}>
            <Text style={[type.body, { width: 40 }]}>T{i + 1}</Text>
            <Text style={[type.numberSmall, { flex: 1 }]}>{reKillPointsByTier[i]} pts each</Text>
            <NumberField value={k} onChange={(n) => setKills(kills.map((x, j) => (j === i ? n : x)))} width={120} />
          </Row>
        ))}
      </Card>
      <SectionHeader title="Point table" />
      <Table rows={reKillPointsByTier.map((p, i) => ({ t: i + 1, p }))} columns={[
        { key: 't', title: 'Tier', render: (r) => `T${r.t}` },
        { key: 'p', title: 'Points / kill', align: 'right', render: (r) => String(r.p) },
      ]} />
      <Text style={[type.caption, { marginTop: space.sm }]}>Values from the community wiki Realm Expedition page.</Text>
    </>
  );
}

function MailGen() {
  const [tplId, setTplId] = useState(mailTemplates[0]!.id);
  const [fmt, setFmt] = useState<MailFormat>('discord');
  const [inputs, setInputs] = useState({ tag: '', time: '', target: '', extra: '' });
  const [copied, setCopied] = useState(false);
  const tpl = mailTemplates.find((t) => t.id === tplId)!;
  const text = tpl.build(inputs, fmt);
  return (
    <>
      <ChipRow>{mailTemplates.map((t) => <Chip key={t.id} label={t.title.split(' — ')[0]!} active={t.id === tplId} onPress={() => setTplId(t.id)} />)}</ChipRow>
      <Card>
        <Segmented options={['discord', 'mail'] as const} value={fmt} onChange={setFmt} labels={{ discord: 'Discord', mail: 'In-game mail' }} />
        <Row style={{ marginTop: space.md }}>
          <Field label="Alliance tag" value={inputs.tag} onChangeText={(t) => setInputs({ ...inputs, tag: t })} placeholder="[TAG]" />
          <Field label="Time" value={inputs.time} onChangeText={(t) => setInputs({ ...inputs, time: t })} placeholder="Sat 10:00 UTC" />
        </Row>
        <View style={{ marginTop: space.sm }}><Field label="Target / detail" value={inputs.target} onChangeText={(t) => setInputs({ ...inputs, target: t })} placeholder="Realm, structure, level…" /></View>
        <View style={{ marginTop: space.sm }}><Field label="Extra note" value={inputs.extra} onChangeText={(t) => setInputs({ ...inputs, extra: t })} placeholder="Optional" /></View>
      </Card>
      <SectionHeader title={tpl.title} />
      <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md }}>
        <Text style={[type.body, { lineHeight: 21 }]} selectable>{text}</Text>
      </View>
      <View style={{ marginTop: space.md }}>
        <Button icon={Copy} label={copied ? 'Copied' : 'Copy message'} onPress={() => {
          Clipboard.setStringAsync(text).then(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
            setCopied(true); setTimeout(() => setCopied(false), 1500);
          }).catch(() => undefined);
        }} />
      </View>
    </>
  );
}
