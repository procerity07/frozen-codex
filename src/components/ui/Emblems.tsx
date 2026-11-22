import Svg, { Circle, G, Line, Path, Polygon } from 'react-native-svg';
import type { Element, UnitType, TroopFocus } from '@/types/game';
import { elementColors, palette, rarityColors, tint, troopColors } from '@/theme';

const HEX = '12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7';

/** Geometric elemental emblem inside a hexagonal frame. */
export function ElementEmblem({ element, size = 22 }: { element: Element; size?: number }) {
  const c = elementColors[element];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={`${element} element`}>
      <Polygon points={HEX} fill={tint(c, 0.16)} stroke={c} strokeWidth={1.2} />
      {element === 'Fire' && <Path d="M12 6.2c1.9 2.4 3.6 4.1 3.6 6.6a3.6 3.6 0 0 1-7.2 0c0-1.4.6-2.4 1.5-3.3.1 1.2.7 2 1.4 2.2-.5-1.8-.1-3.7.7-5.5z" fill={c} />}
      {element === 'Ice' && (
        <G stroke={c} strokeWidth={1.5} strokeLinecap="round">
          <Line x1="12" y1="6.5" x2="12" y2="17.5" />
          <Line x1="7.2" y1="9.2" x2="16.8" y2="14.8" />
          <Line x1="7.2" y1="14.8" x2="16.8" y2="9.2" />
          <Path d="M10.4 7.6 12 9l1.6-1.4M10.4 16.4 12 15l1.6 1.4" fill="none" />
        </G>
      )}
      {element === 'Nature' && (
        <G>
          <Path d="M7 16.5c0-5.3 3.8-8.6 10-9.2-.4 6.3-3.8 10-9 10z" fill={c} />
          <Line x1="7.4" y1="17" x2="13.5" y2="10.6" stroke={palette.bg} strokeWidth={1.1} strokeLinecap="round" />
        </G>
      )}
      {element === 'Light' && (
        <G>
          <Circle cx="12" cy="12" r="2.8" fill={c} />
          <G stroke={c} strokeWidth={1.4} strokeLinecap="round">
            <Line x1="12" y1="5.8" x2="12" y2="7.6" /><Line x1="12" y1="16.4" x2="12" y2="18.2" />
            <Line x1="5.8" y1="12" x2="7.6" y2="12" /><Line x1="16.4" y1="12" x2="18.2" y2="12" />
            <Line x1="7.6" y1="7.6" x2="8.9" y2="8.9" /><Line x1="15.1" y1="15.1" x2="16.4" y2="16.4" />
            <Line x1="7.6" y1="16.4" x2="8.9" y2="15.1" /><Line x1="15.1" y1="8.9" x2="16.4" y2="7.6" />
          </G>
        </G>
      )}
      {element === 'Dark' && <Path d="M14.6 6.6a5.6 5.6 0 1 0 2.8 9.6 4.6 4.6 0 1 1-2.8-9.6z" fill={c} />}
    </Svg>
  );
}

/** Troop-type badge: shield (Infantry), lance chevron (Cavalry), bow (Archer), ring (All-round), crown (Civil). */
export function TroopEmblem({ type, size = 22 }: { type: UnitType | TroopFocus; size?: number }) {
  const c = troopColors[type];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={`${type} troop`}>
      <Circle cx="12" cy="12" r="10.5" fill={tint(c, 0.12)} stroke={c} strokeWidth={1.1} />
      {type === 'Infantry' && <Path d="M12 6.2l5 1.8v3.8c0 3.1-2.1 5.2-5 6.2-2.9-1-5-3.1-5-6.2V8z" fill="none" stroke={c} strokeWidth={1.6} strokeLinejoin="round" />}
      {type === 'Cavalry' && <Path d="M6.8 16.5 12 7.2l5.2 9.3M9.2 12.6h5.6" fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />}
      {type === 'Archer' && (
        <G fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round">
          <Path d="M8.5 6.5c4 2.2 4 8.8 0 11" />
          <Line x1="8.5" y1="6.5" x2="8.5" y2="17.5" />
          <Line x1="8.5" y1="12" x2="17" y2="12" />
          <Path d="M15 10l2 2-2 2" />
        </G>
      )}
      {(type === 'All-round' || type === 'All') && (
        <G fill="none" stroke={c} strokeWidth={1.4}>
          <Circle cx="12" cy="12" r="4.2" />
          <Circle cx="12" cy="12" r="1.4" fill={c} />
        </G>
      )}
      {type === 'Civil' && <Path d="M6.8 15.8V9.2l2.8 2.6L12 7.6l2.4 4.2 2.8-2.6v6.6z" fill="none" stroke={c} strokeWidth={1.5} strokeLinejoin="round" />}
    </Svg>
  );
}

export function RarityStars({ rarity, size = 11 }: { rarity: number; size?: number }) {
  const c = (rarityColors as Record<number, string>)[rarity] ?? palette.textMuted;
  return (
    <Svg width={size * rarity + (rarity - 1) * 2} height={size} viewBox={`0 0 ${rarity * 12 + (rarity - 1) * 2} 12`} accessibilityLabel={`${rarity} star`}>
      {Array.from({ length: rarity }, (_, i) => (
        <Polygon key={i} transform={`translate(${i * 14} 0)`} points="6,0.5 7.6,4.2 11.5,4.5 8.5,7.1 9.4,11 6,8.9 2.6,11 3.5,7.1 0.5,4.5 4.4,4.2" fill={c} />
      ))}
    </Svg>
  );
}
