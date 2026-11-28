import { useState } from 'react';
import { Text, View } from 'react-native';
import { guides } from '@/data/seed';
import { useShops } from '@/services/content';
import { palette, space, type, verdictColors } from '@/theme';
import { Accordion, Badge, Card, Chip, ChipRow, Row, Screen, SectionHeader, Segmented } from '@/components/ui';
import type { Verdict } from '@/types/game';

const VIEWS = ['Shops', 'Playbooks'] as const;
const ORDER: Verdict[] = ['Must Buy', 'Situational', 'Trap / Skip'];

export default function GuidesScreen() {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Shops');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
        <Segmented options={VIEWS} value={view} onChange={setView} />
      </View>
      {view === 'Shops' ? <ShopAdvisor /> : <Playbooks />}
    </View>
  );
}

function ShopAdvisor() {
  const [profile, setProfile] = useState<'f2p' | 'spender'>('f2p');
  const shops = useShops();
  const [shopId, setShopId] = useState(shops[0]!.id);
  const shop = shops.find((s) => s.id === shopId) ?? shops[0]!;
  const items = [...shop.items].sort((a, b) => ORDER.indexOf(a[profile]) - ORDER.indexOf(b[profile]));
  return (
    <Screen sticky={<View style={{ backgroundColor: palette.bg, paddingTop: space.sm }}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Segmented options={['f2p', 'spender'] as const} value={profile} onChange={setProfile} labels={{ f2p: 'F2P', spender: 'Low / Mid Spender' }} />
      </View>
      <ChipRow>{shops.map((s) => <Chip key={s.id} label={s.name} active={s.id === shopId} onPress={() => setShopId(s.id)} />)}</ChipRow>
    </View>}>
      <Card style={{ padding: space.md }}>
        <Text style={type.heading}>{shop.name}</Text>
        <Text style={type.caption}>Currency: {shop.currency} · Refresh: {shop.refresh}</Text>
        <Text style={[type.caption, { marginTop: 4, color: shop.checkedOn ? palette.success : palette.textMuted }]}>
          {shop.checkedOn
            ? `Prices and limits checked in-game on ${shop.checkedOn}. Buy/Skip ratings are suggestions.`
            : 'Prices not checked in-game yet. Buy/Skip ratings are suggestions.'}
        </Text>
      </Card>
      {items.map((i) => {
        const v = i[profile];
        return (
          <Card key={i.name} style={{ padding: space.md }} accent={verdictColors[v]}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={type.heading}>{i.name}</Text>
                <Text style={type.numberSmall}>{i.price}{i.limit ? `  ·  limit ${i.limit}` : ''}</Text>
                {i.requires ? <Text style={[type.caption, { color: palette.warning }]}>Requires {i.requires}</Text> : null}
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
      {guides.map((g) => (
        <Accordion key={g.id} title={g.title} subtitle={g.summary}>
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
