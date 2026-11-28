import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { Check } from 'lucide-react-native';
import { heroes as allHeroes } from '@/data/seed';
import { Chip, ChipRow, Field, haptic } from '@/components/ui';
import { clampEntry, enhancementLabel, hasBonds, maxEnhancement, maxStars, newEntry, type RosterEntry } from '@/lib/roster';
import { useAppStore } from '@/store/useAppStore';
import { elementColors, palette, radius, space, type } from '@/theme';
import type { Hero } from '@/types/game';

const RARITIES = [6, 5, 4, 3, 2] as const;

/** Small − value + control used in the grid. */
function Mini({ value, label, onMinus, onPlus }: { value: string; label: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[type.caption, { fontSize: 10 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm }}>
        <Pressable onPress={onMinus} hitSlop={6} style={{ paddingHorizontal: 8, paddingVertical: 4 }} accessibilityLabel={`Decrease ${label}`}><Text style={type.body}>−</Text></Pressable>
        <Text style={[type.body, { minWidth: 34, textAlign: 'center' }]} noTranslate>{value}</Text>
        <Pressable onPress={onPlus} hitSlop={6} style={{ paddingHorizontal: 8, paddingVertical: 4 }} accessibilityLabel={`Increase ${label}`}><Text style={type.body}>+</Text></Pressable>
      </View>
    </View>
  );
}

const Row = memo(function Row({ hero, entry, onSet, onRemove }: { hero: Hero; entry?: RosterEntry; onSet: (e: RosterEntry) => void; onRemove: () => void }) {
  const owned = !!entry;
  const e = entry ? clampEntry(hero, entry) : newEntry(hero);
  const upd = (p: Partial<RosterEntry>) => onSet(clampEntry(hero, { ...e, ...p }));
  return (
    <View style={{ paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: palette.border }}>
      <Pressable onPress={() => { haptic(); owned ? onRemove() : onSet(newEntry(hero)); }} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }} accessibilityRole="checkbox" accessibilityState={{ checked: owned }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: owned ? palette.cyan : palette.border, backgroundColor: owned ? palette.cyan : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {owned ? <Check size={16} color={palette.bg} /> : null}
        </View>
        <Text style={[type.body, { flex: 1, fontWeight: '600', color: elementColors[hero.element] ?? palette.text }]} noTranslate>{hero.name}</Text>
        <Text style={type.caption} noTranslate>{`${hero.rarity}★ · ${hero.unitType}`}</Text>
      </Pressable>
      {owned ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm, marginLeft: 32, alignItems: 'flex-end' }}>
          <Mini label="Stars" value={`${e.stars}★`} onMinus={() => upd({ stars: e.stars - 1 })} onPlus={() => upd({ stars: Math.min(maxStars(hero), e.stars + 1) })} />
          <Mini label="Enh." value={enhancementLabel(e.enhancement)} onMinus={() => upd({ enhancement: e.enhancement - 1 })} onPlus={() => upd({ enhancement: Math.min(maxEnhancement(e.stars), e.enhancement + 1) })} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[type.caption, { fontSize: 10 }]}>Level</Text>
            <TextInput
              defaultValue={e.level ? String(e.level) : ''}
              onEndEditing={(ev) => upd({ level: Number(ev.nativeEvent.text.replace(/\D/g, '')) || 0 })}
              onBlur={(ev) => { const t = (ev as unknown as { target?: { value?: string } }).target?.value; if (typeof t === 'string') upd({ level: Number(t.replace(/\D/g, '')) || 0 }); }}
              keyboardType="number-pad" placeholder="0" placeholderTextColor={palette.textMuted}
              style={{ width: 64, height: 30, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, color: palette.text, textAlign: 'center', minWidth: 0 }}
            />
          </View>
          {hasBonds(hero) ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={[type.caption, { fontSize: 10 }]}>Bond</Text>
              <TextInput
                defaultValue={e.bond ? String(e.bond) : ''}
                onEndEditing={(ev) => upd({ bond: Number(ev.nativeEvent.text.replace(/\D/g, '')) || 0 })}
                onBlur={(ev) => { const t = (ev as unknown as { target?: { value?: string } }).target?.value; if (typeof t === 'string') upd({ bond: Number(t.replace(/\D/g, '')) || 0 }); }}
                keyboardType="number-pad" placeholder="0" placeholderTextColor={palette.textMuted}
                style={{ width: 52, height: 30, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, color: palette.text, textAlign: 'center', minWidth: 0 }}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

/** Add or update many heroes at once: tick the ones you own and set stars, enhancement, level and bond inline. */
export default function RosterSetup() {
  const roster = useAppStore((s) => s.roster);
  const setEntry = useAppStore((s) => s.setRosterEntry);
  const remove = useAppStore((s) => s.removeFromRoster);
  const [q, setQ] = useState('');
  const [rar, setRar] = useState<number | null>(null);
  const [onlyOwned, setOnlyOwned] = useState(false);
  const list = useMemo(() => allHeroes
    .filter((h) => (!rar || h.rarity === rar) && (!onlyOwned || roster[h.id]) && (!q || h.name.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name)), [q, rar, onlyOwned, roster]);
  const count = Object.keys(roster).length;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: `Set up my heroes (${count})` }} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xs }}>
        <Text style={type.caption}>Tick each hero you own, then set stars, enhancement, level and bond. Changes save straight away.</Text>
        <View style={{ height: 44 }}><Field placeholder="Search heroes" value={q} onChangeText={setQ} autoCapitalize="none" /></View>
        <ChipRow>
          <Chip label="All" active={!rar} onPress={() => setRar(null)} />
          {RARITIES.map((r) => <Chip key={r} label={`${r}★`} active={rar === r} onPress={() => setRar(r)} />)}
          <Chip label={`Owned (${count})`} active={onlyOwned} onPress={() => setOnlyOwned(!onlyOwned)} />
        </ChipRow>
      </View>
      <FlatList
        data={list}
        keyExtractor={(h) => h.id}
        renderItem={({ item }) => <Row hero={item} entry={roster[item.id]} onSet={(e) => setEntry(item.id, e)} onRemove={() => remove(item.id)} />}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
      />
    </View>
  );
}
