import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { Check, Copy, ExternalLink, Plus, Trash } from 'lucide-react-native';
import type { GiftCode } from '@/types/game';
import { addGiftCode, listGiftCodes, removeGiftCode } from '@/db/repo';
import { GIFT_CODE_URL } from '@/data/seed';
import { palette, radius, space, type } from '@/theme';
import { Badge, BottomSheet, Button, Card, Field, IconButton, Row, Screen, SectionHeader, Segmented } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';

export default function GiftCodeVault() {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [filter, setFilter] = useState<'unclaimed' | 'claimed' | 'all'>('unclaimed');
  const [newCode, setNewCode] = useState('');
  const [newRewards, setNewRewards] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const claimed = useAppStore((s) => s.claimedCodes);
  const toggleClaimed = useAppStore((s) => s.toggleClaimed);
  const realm = useAppStore((s) => s.realm);
  const setRealm = useAppStore((s) => s.setRealm);

  const refresh = useCallback(() => { listGiftCodes().then(setCodes).catch(() => undefined); }, []);
  useEffect(refresh, [refresh]);

  const copy = async (code: string) => {
    await Clipboard.setStringAsync(code.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  };

  const shown = codes.filter((c) => filter === 'all' || (filter === 'claimed' ? claimed.includes(c.code) : !claimed.includes(c.code)));

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Gift Code Vault' }} />
      <Card style={{ marginTop: space.sm }}>
        <Text style={type.caption}>Saved locally for the redemption form</Text>
        <Row style={{ marginTop: space.sm }}>
          <Field label="Server" value={realm.server} onChangeText={(v) => setRealm({ server: v })} placeholder="e.g. 412" keyboardType="numeric" />
          <Field label="Lord name" value={realm.lordName} onChangeText={(v) => setRealm({ lordName: v })} placeholder="Your lord" autoCapitalize="none" />
        </Row>
        <Row style={{ marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button label="Redeem in app" onPress={() => { setLoading(true); setSheet(true); }} /></View>
          <IconButton icon={ExternalLink} label="Open in browser" color={palette.cyan} onPress={() => { WebBrowser.openBrowserAsync(GIFT_CODE_URL).catch(() => undefined); }} />
        </Row>
      </Card>

      <SectionHeader title="Codes" subtitle={`${codes.length - claimed.filter((c) => codes.some((x) => x.code === c)).length} unclaimed · tap to copy`} />
      <Segmented options={['unclaimed', 'claimed', 'all'] as const} value={filter} onChange={setFilter} labels={{ unclaimed: 'Unclaimed', claimed: 'Claimed', all: 'All' }} />
      <View style={{ marginTop: space.md }}>
        {shown.map((c) => {
          const isClaimed = claimed.includes(c.code);
          return (
            <View key={c.code} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: palette.surface, borderWidth: 1, borderColor: copied === c.code ? palette.cyan : palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm }}>
              <Pressable onPress={() => { copy(c.code).catch(() => undefined); }} style={{ flex: 1 }} accessibilityLabel={`Copy code ${c.code}`}>
                <Row gap={6}>
                  <Text style={[type.title, { fontVariant: ['tabular-nums'], letterSpacing: 0.5, color: isClaimed ? palette.textMuted : palette.text }]}>{c.code}</Text>
                  {c.userAdded ? <Badge label="Added" color={palette.cyan} /> : null}
                </Row>
                <Text style={type.caption}>{copied === c.code ? 'Copied to clipboard' : c.rewards}</Text>
              </Pressable>
              <IconButton icon={Copy} label="Copy" onPress={() => { copy(c.code).catch(() => undefined); }} />
              <IconButton icon={Check} label={isClaimed ? 'Mark unclaimed' : 'Mark claimed'} active={isClaimed} onPress={() => toggleClaimed(c.code)} />
              {c.userAdded ? <IconButton icon={Trash} label="Delete" color={palette.danger} onPress={() => { removeGiftCode(c.code).then(refresh).catch(() => undefined); }} /> : null}
            </View>
          );
        })}
      </View>

      <SectionHeader title="Add a code" />
      <Card>
        <Row>
          <Field placeholder="CODE" value={newCode} onChangeText={(t) => setNewCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} />
          <Field placeholder="Rewards (optional)" value={newRewards} onChangeText={setNewRewards} />
        </Row>
        <View style={{ marginTop: space.md }}>
          <Button icon={Plus} variant="secondary" label="Save code" disabled={!newCode.trim()} onPress={() => { addGiftCode(newCode, newRewards).then(() => { setNewCode(''); setNewRewards(''); refresh(); }).catch(() => undefined); }} />
        </View>
      </Card>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Redeem gift code" subtitle={`Server ${realm.server || '—'} · ${realm.lordName || 'set your lord name'} · paste the copied code`} heightRatio={0.92} scroll={false}>
        <View style={{ flex: 1, minHeight: 420, marginHorizontal: space.md, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: palette.border }}>
          <WebView source={{ uri: GIFT_CODE_URL }} onLoadEnd={() => setLoading(false)} style={{ flex: 1, backgroundColor: palette.bg }} />
          {loading ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={palette.cyan} /></View> : null}
        </View>
      </BottomSheet>
    </Screen>
  );
}
