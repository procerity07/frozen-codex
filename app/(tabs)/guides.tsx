import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Database, Settings } from 'lucide-react-native';
import { guides, shops } from '@/data/seed';
import { palette, space, type, verdictColors } from '@/theme';
import { Accordion, Badge, Button, Card, Chip, ChipRow, Row, Screen, SectionHeader, Segmented } from '@/components/ui';
import type { Verdict } from '@/types/game';

const VIEWS = ['Shops', 'Playbooks', 'Settings'] as const;
const ORDER: Verdict[] = ['Must Buy', 'Situational', 'Trap / Skip'];

export default function GuidesScreen() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Shops');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
        <Segmented options={VIEWS} value={view} onChange={setView} />
      </View>
      {view === 'Shops' ? <ShopAdvisor /> : view === 'Playbooks' ? <Playbooks /> : <SettingsEntry />}
    </View>
  );
}

function ShopAdvisor() {
  const [profile, setProfile] = useState<'f2p' | 'spender'>('f2p');
  const [shopId, setShopId] = useState(shops[0]!.id);
  const shop = shops.find((s) => s.id === shopId)!;
  const items = [...shop.items].sort((a, b) => ORDER.indexOf(a[profile]) - ORDER.indexOf(b[profile]));
  return (
    <Screen sticky={<View style={{ backgroundColor: palette.bg, paddingTop: space.sm }}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Segmented options={['f2p', 'spender'] as const} value={profile} onChange={setProfile} labels={{ f2p: 'F2P', spender: 'Low / Mid Spender' }} />
      </View>
      <ChipRow>{shops.map((s) => <Chip key={s.id} label={s.name} active={s.id === shopId} onPress={() => setShopId(s.id)} />)}</ChipRow>
    </View>}>
      <Card style={{ marginBottom: space.md, padding: space.md }}>
        <Text style={type.heading}>{shop.name}</Text>
        <Text style={type.caption}>Currency: {shop.currency} · Refresh: {shop.refresh}</Text>
      </Card>
      {items.map((i) => {
        const v = i[profile];
        return (
          <Card key={i.name} style={{ marginBottom: space.sm, padding: space.md }} accent={verdictColors[v]}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={type.heading}>{i.name}</Text>
                <Text style={type.numberSmall}>{i.price}</Text>
              </View>
              <Badge label={v} color={verdictColors[v]} />
            </Row>
            <Text style={[type.bodySecondary, { marginTop: 4 }]}>{i.reason}</Text>
          </Card>
        );
      })}
    </Screen>
  );
}

function Playbooks() {
  return (
    <Screen>
      <SectionHeader title="Strategy playbooks" subtitle={`${guides.length} guides`} />
      {guides.map((g, idx) => (
        <Accordion key={g.id} title={g.title} subtitle={g.summary} initiallyOpen={idx === 0}>
          {g.sections.map((s) => (
            <View key={s.heading} style={{ marginBottom: space.md }}>
              <Text style={[type.heading, { color: palette.cyan, marginBottom: 4 }]}>{s.heading}</Text>
              {s.points.map((p, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{'•'} {p}</Text>)}
            </View>
          ))}
        </Accordion>
      ))}
    </Screen>
  );
}

function SettingsEntry() {
  return (
    <Screen>
      <SectionHeader title="Settings & data" />
      <Card>
        <Text style={type.body}>Realm profile, alarm lead time, JSON backup/restore and remote database updates.</Text>
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Button icon={Settings} label="Open settings" onPress={() => router.push('/tools/settings')} />
          <Button icon={Database} variant="secondary" label="Check for database updates" onPress={() => router.push('/tools/settings')} />
        </View>
      </Card>
    </Screen>
  );
}
