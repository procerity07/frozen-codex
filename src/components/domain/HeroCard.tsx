import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Hero, TroopFocus } from '@/types/game';
import { palette, radius, space, type } from '@/theme';
import { Badge, RarityStars, TroopEmblem } from '@/components/ui';
import { HeroPortrait } from './HeroPortrait';
import type { RosterEntry } from '@/lib/roster';
import { enhancementLabel } from '@/lib/roster';

export function matchesFocus(h: Hero, focus: TroopFocus): boolean {
  if (focus === 'All') return false;
  return h.unitType === focus;
}

function HeroCardImpl({ hero, focus, onPress, owned }: { hero: Hero; focus: TroopFocus; onPress: () => void; owned?: RosterEntry }) {
  const highlighted = matchesFocus(hero, focus);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, highlighted && { borderColor: palette.cyanLine }, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={`${hero.name}, ${hero.rarity} star ${hero.element} ${hero.unitType}`}>
      <HeroPortrait hero={hero} size={48} stars={owned?.stars} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={st.nameRow}>
          <Text style={type.heading} numberOfLines={1}>{hero.name}</Text>
          <TroopEmblem type={hero.unitType} size={16} />
        </View>
        <RarityStars rarity={owned?.stars ?? hero.rarity} size={10} />
        <Text style={type.caption} numberOfLines={1}>{hero.element} · {hero.unitType}</Text>
      </View>
      {owned ? (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge label="Owned" color={palette.success} />
          <Text style={type.numberSmall}>{enhancementLabel(owned.enhancement)} · Lv {owned.level}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export const HeroCard = memo(HeroCardImpl);

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
