import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Stack, router, type Href } from 'expo-router';
import { Field, haptic } from '@/components/ui';
import { searchEverything, type ResultKind } from '@/lib/globalSearch';
import { palette, space, type } from '@/theme';

const KIND_COLOR: Record<ResultKind, string> = { Hero: palette.gold, Event: palette.cyan, Curio: '#A855F7', Guide: palette.success, 'Shop item': palette.textSecondary, "Sophia's Test": palette.cyan };

/** Search heroes, events, curios, guides, shop items and Sophia's Test answers in one place. */
export default function SearchScreen() {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchEverything(q), [q]);
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, height: 56 }}>
        <Field placeholder="Hero, event, curio, item, Sophia question…" value={q} onChangeText={setQ} autoFocus autoCapitalize="none" />
      </View>
      <FlatList
        data={results}
        keyExtractor={(r, i) => `${r.kind}-${r.title}-${i}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 60 }}
        ListEmptyComponent={<Text style={[type.bodySecondary, { marginTop: space.lg }]}>{q.trim().length < 2 ? 'Type at least 2 letters.' : 'Nothing found.'}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => { haptic(); router.push(item.href as Href); }} style={({ pressed }) => [{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: palette.border }, pressed && { opacity: 0.7 }]}>
            <Text style={[type.caption, { color: KIND_COLOR[item.kind] }]}>{item.kind}</Text>
            <Text style={[type.body, { fontWeight: '600' }]} numberOfLines={1} noTranslate={item.kind === 'Hero' || item.kind === 'Curio'}>{item.title}</Text>
            <Text style={type.caption} numberOfLines={2}>{item.detail}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
