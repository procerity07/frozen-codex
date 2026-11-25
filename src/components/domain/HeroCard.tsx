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
          <View style={st.emblem}><TroopEmblem type={hero.unitType} size={16} /></View>
          <Text style={[type.heading, { flexShrink: 1 }]} numberOfLines={1}>{hero.name}</Text>
        </View>
        <RarityStars rarity={owned?.stars ?? hero.rarity} size={10} />
        <Text style={type.caption} numberOfLines={1}>{hero.element} · {hero.unitType}</Text>
      </View>
      <View style={st.ownedCol}>
        {owned ? (
          <>
            <Badge label="Owned" color={palette.success} />
            <Text style={type.numberSmall} numberOfLines={1}>{enhancementLabel(owned.enhancement)} · Lv {owned.level}</Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

export const HeroCard = memo(HeroCardImpl);

const st = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emblem: { width: 18, alignItems: 'center' },
  ownedCol: { width: 96, alignItems: 'flex-end', gap: 4 },
});
