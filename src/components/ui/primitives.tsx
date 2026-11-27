import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { palette, radius, space, tint, type } from '@/theme';
import type { Confidence } from '@/types/game';

export const haptic = () => { Haptics.selectionAsync().catch(() => undefined); };

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return <View style={[s.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>{children}</View>;
}

export function SectionHeader({ title, subtitle, icon: Icon, right }: { title: string; subtitle?: string; icon?: LucideIcon; right?: ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      {Icon ? <View style={s.sectionIcon}><Icon size={16} color={palette.cyan} strokeWidth={2} /></View> : null}
      <View style={{ flex: 1 }}>
        <Text style={type.heading}>{title}</Text>
        {subtitle ? <Text style={[type.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Chip({ label, active, onPress, color = palette.cyan, leading }: { label: string; active?: boolean; onPress?: () => void; color?: string; leading?: ReactNode }) {
  return (
    <Pressable
      onPress={() => { haptic(); onPress?.(); }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [s.chip, active && { backgroundColor: tint(color, 0.16), borderColor: color }, pressed && { opacity: 0.7 }]}
    >
      {leading}
      <Text style={[s.chipText, active && { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
      {children}
    </ScrollView>
  );
}

export function Segmented<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T; onChange: (v: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <View style={s.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable key={o} onPress={() => { haptic(); onChange(o); }} style={[s.segmentItem, active && s.segmentActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text numberOfLines={1} style={[s.segmentText, active && { color: palette.text }]}>{labels?.[o] ?? o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({ label, onPress, icon: Icon, variant = 'primary', disabled, compact }: { label: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'ghost' | 'gold'; disabled?: boolean; compact?: boolean }) {
  const bg = variant === 'primary' ? palette.cyan : variant === 'gold' ? palette.gold : variant === 'secondary' ? palette.modal : 'transparent';
  const fg = variant === 'primary' || variant === 'gold' ? palette.bg : palette.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { haptic(); onPress(); }}
      accessibilityRole="button"
      style={({ pressed }) => [s.button, compact && s.buttonCompact, { backgroundColor: bg }, variant === 'secondary' && { borderWidth: 1, borderColor: palette.borderStrong }, (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 }]}
    >
      {Icon ? <Icon size={16} color={fg} strokeWidth={2.2} /> : null}
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ icon: Icon, onPress, label, color = palette.textSecondary, active }: { icon: LucideIcon; onPress: () => void; label: string; color?: string; active?: boolean }) {
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [s.iconBtn, active && { backgroundColor: palette.cyanDim, borderColor: palette.cyanLine }, pressed && { opacity: 0.6 }]}>
      <Icon size={18} color={active ? palette.cyan : color} strokeWidth={2} />
    </Pressable>
  );
}

export function Badge({ label, color = palette.textSecondary }: { label: string; color?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: tint(color, 0.14), borderColor: tint(color, 0.4) }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Stat({ label, value, color = palette.text, align = 'left' }: { label: string; value: string; color?: string; align?: 'left' | 'right' }) {
  return (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <Text style={type.caption}>{label}</Text>
      <Text style={[type.number, { color, fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.border, marginVertical: space.sm }} />;
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 4, flex: 1, minWidth: 0 }}>
      {label ? <Text style={type.caption}>{label}</Text> : null}
      <TextInput placeholderTextColor={palette.textMuted} style={[s.input, style]} selectionColor={palette.cyan} {...rest} />
    </View>
  );
}

/** Numeric input that keeps tabular alignment and clamps to >= 0. */
export function NumberField({ label, value, onChange, suffix, width }: { label?: string; value: number; onChange: (n: number) => void; suffix?: string; width?: number }) {
  return (
    <View style={{ gap: 4, flex: width ? undefined : 1, width, minWidth: 0 }}>
      {label ? <Text style={type.caption} numberOfLines={1}>{label}</Text> : null}
      <View style={s.numberWrap}>
        <TextInput
          value={value ? String(value) : ''}
          onChangeText={(t) => onChange(Math.max(0, Number(t.replace(/[^0-9.]/g, '')) || 0))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.cyan}
          style={[s.input, s.numberInput]}
        />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

/** Compact −/+ control for small integer ranges (stars, enhancement, bond). */
export function Stepper({ label, value, min, max, onChange, format, step = 1 }: {
  label: string; value: number; min: number; max: number; onChange: (n: number) => void; format?: (n: number) => string; step?: number;
}) {
  const set = (n: number) => { const v = Math.min(max, Math.max(min, n)); if (v !== value) { haptic(); onChange(v); } };
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Text style={type.caption} numberOfLines={1}>{label}</Text>
      <View style={s.stepper}>
        <Pressable onPress={() => set(value - step)} disabled={value <= min} hitSlop={6} accessibilityLabel={`Decrease ${label}`} style={[s.stepBtn, value <= min && { opacity: 0.35 }]}>
          <Text style={s.stepGlyph}>{'\u2212'}</Text>
        </Pressable>
        <Text style={[type.number, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{format ? format(value) : value}</Text>
        <Pressable onPress={() => set(value + step)} disabled={value >= max} hitSlop={6} accessibilityLabel={`Increase ${label}`} style={[s.stepBtn, value >= max && { opacity: 0.35 }]}>
          <Text style={s.stepGlyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ProgressBar({ ratio, color = palette.cyan, height = 6 }: { ratio: number; color?: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: palette.border, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, height, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function ConfidenceNote({ confidence }: { confidence: Confidence }) {
  if (confidence === 'verified') return null;
  const text = confidence === 'community' ? 'Community-sourced data' : 'Estimated values — refresh via Settings › Database updates';
  return (
    <Row gap={6} style={{ marginTop: space.sm }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: confidence === 'community' ? palette.cyan : palette.gold }} />
      <Text style={[type.caption, { color: palette.textMuted }]}>{text}</Text>
    </Row>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ padding: space.xxl, alignItems: 'center', gap: 6 }}>
      <Text style={type.heading}>{title}</Text>
      {body ? <Text style={[type.bodySecondary, { textAlign: 'center' }]}>{body}</Text> : null}
    </View>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xl, marginBottom: space.md },
  sectionIcon: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: palette.cyanDim, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  chipText: { fontSize: 13, fontWeight: '600', color: palette.textSecondary },
  chipRow: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  segment: { flexDirection: 'row', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: 3 },
  segmentItem: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: 4 },
  segmentActive: { backgroundColor: palette.modal, borderWidth: 1, borderColor: palette.borderStrong },
  segmentText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, paddingHorizontal: space.lg, borderRadius: radius.md },
  buttonCompact: { height: 36, paddingHorizontal: space.md },
  buttonText: { fontSize: 14, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  input: { minWidth: 0, width: '100%', height: 42, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, paddingHorizontal: space.md, color: palette.text, fontSize: 14 },
  numberWrap: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  numberInput: { flex: 1, minWidth: 0, width: undefined, fontVariant: ['tabular-nums'], textAlign: 'right' },
  suffix: { ...type.numberSmall, marginLeft: 6, color: palette.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 42, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, backgroundColor: palette.bg },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontSize: 20, fontWeight: '600', color: palette.cyan },
});
