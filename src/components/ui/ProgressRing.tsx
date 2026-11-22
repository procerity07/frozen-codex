import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, type } from '@/theme';

export function ProgressRing({ ratio, size = 72, stroke = 7, color = palette.cyan, label, sub }: { ratio: number; size?: number; stroke?: number; color?: string; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={palette.border} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {label ? <Text style={[type.number, { fontSize: size > 64 ? 15 : 12 }]}>{label}</Text> : null}
      {sub ? <Text style={[type.caption, { fontSize: 10 }]}>{sub}</Text> : null}
    </View>
  );
}
