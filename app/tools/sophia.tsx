import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Search, X } from 'lucide-react-native';
import type { SophiaQuestion } from '@/types/game';
import { countSophia, searchSophia } from '@/db/repo';
import { palette, radius, space, type } from '@/theme';
import { Badge, EmptyState, IconButton, haptic } from '@/components/ui';
import { SophiaBubbleToggle } from '@/components/domain/SophiaBubbleToggle';

export default function SophiaLookup() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(typeof params.q === 'string' ? params.q : '');
  const [rows, setRows] = useState<SophiaQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [ms, setMs] = useState(0);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => { countSophia().then(setTotal).catch(() => undefined); }, []);
  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    searchSophia(q, 30).then((r) => { if (alive) { setRows(r); setMs(Date.now() - t0); } }).catch(() => undefined);
    return () => { alive = false; };
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: "Sophia's Test" }} />
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.cyanLine, borderRadius: radius.md, paddingHorizontal: space.md }}>
          <Search size={18} color={palette.cyan} />
          <TextInput
            ref={input}
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Type 2–3 words from the question"
            placeholderTextColor={palette.textMuted}
            selectionColor={palette.cyan}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{ flex: 1, height: 50, color: palette.text, fontSize: 16, marginLeft: space.sm }}
          />
          {q ? <IconButton icon={X} label="Clear" onPress={() => { setQ(''); input.current?.focus(); }} /> : null}
        </View>
        <Text style={[type.caption, { marginTop: space.sm, fontVariant: ['tabular-nums'] }]}>{rows.length} of {total} answers · {ms} ms</Text>
        <View style={{ marginTop: space.sm }}><SophiaBubbleToggle /></View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 48 }}
        renderItem={({ item, index }) => (
          <Pressable
            onLongPress={() => { haptic(); Clipboard.setStringAsync(item.answer).catch(() => undefined); }}
            style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: index === 0 && q ? palette.cyan : palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm }}
          >
            <Text style={type.bodySecondary}>{item.question}</Text>
            <Text style={[type.title, { color: index === 0 && q ? palette.cyan : palette.text, marginTop: 6 }]}>{item.answer}</Text>
            <View style={{ marginTop: 6 }}><Badge label={item.category} /></View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="No match" body="Try fewer or different words. Long-press any answer to copy it." />}
      />
    </View>
  );
}
