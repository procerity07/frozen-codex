import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Marker, Path, Text as SvgText } from 'react-native-svg';
import { elementColors, palette, space, troopColors, type } from '@/theme';
import type { Element, TroopType } from '@/types/game';
import { ElementEmblem, TroopEmblem, haptic } from '@/components/ui';

const W = 300;
const H = 230;

const beats: Record<Element, Element[]> = { Fire: ['Nature'], Nature: ['Ice'], Ice: ['Fire'], Light: ['Dark'], Dark: ['Light'] };

/** Interactive Match-3 elemental wheel: tap an element to highlight what it beats and what beats it. */
export function ElementWheel() {
  const [sel, setSel] = useState<Element>('Fire');
  const pos: Record<Element, { x: number; y: number }> = {
    Fire: { x: 100, y: 40 }, Nature: { x: 170, y: 150 }, Ice: { x: 30, y: 150 }, Light: { x: 250, y: 50 }, Dark: { x: 250, y: 170 },
  };
  const arrows: [Element, Element][] = [['Fire', 'Nature'], ['Nature', 'Ice'], ['Ice', 'Fire'], ['Light', 'Dark'], ['Dark', 'Light']];
  const weakTo = (Object.keys(beats) as Element[]).filter((e) => beats[e].includes(sel));
  return (
    <View>
      <View style={{ width: W, height: H, alignSelf: 'center' }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <Marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <Path d="M0 0 L10 5 L0 10 z" fill={palette.textSecondary} />
          </Marker>
        </Defs>
        {arrows.map(([a, b], i) => {
          const p = pos[a]; const q = pos[b];
          const dx = q.x - p.x; const dy = q.y - p.y; const len = Math.hypot(dx, dy);
          const ux = dx / len; const uy = dy / len;
          const active = a === sel || b === sel;
          const bend = a === 'Light' || a === 'Dark' ? (a === 'Light' ? 22 : -22) : 0;
          const x1 = p.x + 26 + ux * 24; const y1 = p.y + 26 + uy * 24;
          const x2 = q.x + 26 - ux * 28; const y2 = q.y + 26 - uy * 28;
          const mx = (x1 + x2) / 2 - uy * bend; const my = (y1 + y2) / 2 + ux * bend;
          return <Path key={i} d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} stroke={active ? elementColors[a] : palette.borderStrong} strokeWidth={active ? 2.4 : 1.4} fill="none" markerEnd="url(#arrow)" />;
        })}
        {(Object.keys(pos) as Element[]).map((e) => (
          <G key={e} x={pos[e].x} y={pos[e].y} onPress={() => { haptic(); setSel(e); }}>
            <Circle cx={26} cy={26} r={24} fill={e === sel ? palette.modal : palette.surface} stroke={e === sel ? elementColors[e] : palette.border} strokeWidth={e === sel ? 2 : 1} />
            <SvgText x={26} y={62} fill={palette.textSecondary} fontSize={11} fontWeight="600" textAnchor="middle">{e}</SvgText>
          </G>
        ))}
      </Svg>
      {(Object.keys(pos) as Element[]).map((e) => (
        <Pressable key={e} onPress={() => { haptic(); setSel(e); }} style={{ position: 'absolute', left: pos[e].x + 13, top: pos[e].y + 13 }} accessibilityLabel={e}>
          <ElementEmblem element={e} size={26} />
        </Pressable>
      ))}
      </View>
      <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{sel} deals bonus damage to</Text>
          <Text style={[type.heading, { color: elementColors[beats[sel][0]!] }]}>{beats[sel].join(', ')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{sel} is weak to</Text>
          <Text style={[type.heading, { color: weakTo[0] ? elementColors[weakTo[0]] : palette.text }]}>{weakTo.join(', ')}</Text>
        </View>
      </View>
    </View>
  );
}

const troopBeats: Record<TroopType, TroopType> = { Infantry: 'Archer', Archer: 'Cavalry', Cavalry: 'Infantry' };

export function TroopTriangle() {
  const [sel, setSel] = useState<TroopType>('Infantry');
  const pos: Record<TroopType, { x: number; y: number }> = { Infantry: { x: 150, y: 34 }, Archer: { x: 250, y: 180 }, Cavalry: { x: 50, y: 180 } };
  const order: TroopType[] = ['Infantry', 'Archer', 'Cavalry'];
  const weak = order.find((t) => troopBeats[t] === sel)!;
  return (
    <View>
      <View style={{ width: W, height: H, alignSelf: 'center' }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <Marker id="tarrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <Path d="M0 0 L10 5 L0 10 z" fill={palette.textSecondary} />
          </Marker>
        </Defs>
        {order.map((a) => {
          const b = troopBeats[a];
          const p = pos[a]; const q = pos[b];
          const dx = q.x - p.x; const dy = q.y - p.y; const len = Math.hypot(dx, dy);
          const ux = dx / len; const uy = dy / len;
          const active = a === sel || b === sel;
          return <Path key={a} d={`M${p.x + ux * 30} ${p.y + uy * 30} L${q.x - ux * 34} ${q.y - uy * 34}`} stroke={active ? troopColors[a] : palette.borderStrong} strokeWidth={active ? 2.4 : 1.4} markerEnd="url(#tarrow)" />;
        })}
        {order.map((t) => (
          <G key={t} onPress={() => { haptic(); setSel(t); }}>
            <Circle cx={pos[t].x} cy={pos[t].y} r={26} fill={t === sel ? palette.modal : palette.surface} stroke={t === sel ? troopColors[t] : palette.border} strokeWidth={t === sel ? 2 : 1} />
            <SvgText x={pos[t].x} y={pos[t].y + 42} fill={palette.textSecondary} fontSize={11} fontWeight="600" textAnchor="middle">{t}</SvgText>
          </G>
        ))}
      </Svg>
      {order.map((t) => (
        <Pressable key={t} onPress={() => { haptic(); setSel(t); }} style={{ position: 'absolute', left: pos[t].x - 13, top: pos[t].y - 13 }} accessibilityLabel={t}>
          <TroopEmblem type={t} size={26} />
        </Pressable>
      ))}
      </View>
      <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{sel} beats</Text>
          <Text style={[type.heading, { color: troopColors[troopBeats[sel]] }]}>{troopBeats[sel]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{sel} is countered by</Text>
          <Text style={[type.heading, { color: troopColors[weak] }]}>{weak}</Text>
        </View>
      </View>
    </View>
  );
}
