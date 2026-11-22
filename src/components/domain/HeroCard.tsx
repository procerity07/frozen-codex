import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Hero, TroopFocus } from '@/types/game';
import { palette, radius, rarityColors, space, tierColors, tint, type } from '@/theme';
import { ElementEmblem, RarityStars, TroopEmblem } from '@/components/ui';

const MODES: { key: keyof Hero['tiers']; label: string }[] = [
  { key: 'pve', label: 'PvE' }, { key: 'pvp', label: 'PvP' }, { key: 'boss', label: 'Boss' }, { key: 'economy', label: 'Eco' },
];

export function matchesFocus(h: Hero, focus: TroopFocus): boolean {
  if (focus === 'All') return false;
  return h.unitType === focus;
}

function HeroCardImpl({ hero, focus, onPress }: { hero: Hero; focus: TroopFocus; onPress: () => void }) {
  const highlighted = matchesFocus(hero, focus);
  const rc = rarityColors[hero.rarity];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, highlighted && { borderColor: palette.cyanLine }, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={`${hero.name}, ${hero.rarity} star ${hero.element} ${hero.unitType}`}>
      <View style={[st.portrait, { borderColor: rc, backgroundColor: tint(rc, 0.1) }]}>
        <Text style={[st.initial, { color: rc }]}>{hero.name.slice(0, 1)}</Text>
        <View style={st.portraitEmblem}><ElementEmblem element={hero.element} size={18} /></View>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={st.nameRow}>
          <Text style={type.heading} numberOfLines={1}>{hero.name}</Text>
          <TroopEmblem type={hero.unitType} size={16} />
        </View>
        <RarityStars rarity={hero.rarity} size={10} />
        <Text style={type.caption} numberOfLines={1}>{hero.role} · {hero.unitType}</Text>
      </View>
      <View style={st.tiers}>
        {MODES.map((m) => (
          <View key={m.key} style={st.tierCell}>
            <Text style={st.tierLabel}>{m.label}</Text>
            <Text style={[st.tierValue, { color: tierColors[hero.tiers[m.key]] }]}>{hero.tiers[m.key]}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export const HeroCard = memo(HeroCardImpl);

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  portrait: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 22, fontWeight: '800' },
  portraitEmblem: { position: 'absolute', right: -6, bottom: -6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tiers: { flexDirection: 'row', gap: 2, width: 104 },
  tierCell: { flex: 1, alignItems: 'center' },
  tierLabel: { fontSize: 9, fontWeight: '600', color: palette.textMuted },
  tierValue: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
