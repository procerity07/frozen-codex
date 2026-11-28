/** Game-styled building blocks for event pages (banner, tabs, point rows, framed panels). */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { haptic } from '@/components/ui';
import { palette, radius, space, type } from '@/theme';

const GOLD = '#F2C94C';
const DEEP = '#16213A';

/** Banner: dark gradient with a gold-edged title ribbon, like the top of an in-game event. */
export function GameBanner({ title, lines, accent = GOLD, children }: { title: string; lines?: { label: string; value: string; color?: string }[]; accent?: string; children?: ReactNode }) {
  return (
    <View style={[st.banner, { borderColor: accent }]}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#2A3B66" />
            <Stop offset="0.55" stopColor={DEEP} />
            <Stop offset="1" stopColor="#0B1222" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>
      <View style={[st.ribbon, { borderColor: accent }]}>
        <Text style={[st.ribbonText, { color: accent }]} numberOfLines={2}>{title}</Text>
      </View>
      <View style={{ padding: space.md, gap: 2 }}>
        {(lines ?? []).map((l) => (
          <Text key={l.label} style={st.line}>{`${l.label}: `}<Text style={{ color: l.color ?? GOLD, fontWeight: '700' }}>{l.value}</Text></Text>
        ))}
        {children}
      </View>
    </View>
  );
}

/** Tabs with a glowing underline, like "Phase Pts · Phase Rank · Total Rank". */
export function GameTabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <View style={st.tabs}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable key={t.key} onPress={() => { haptic(); onChange(t.key); }} style={st.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Text style={[st.tabText, on && { color: palette.cyan }]} numberOfLines={1}>{t.label}</Text>
            <View style={[st.tabLine, on && { backgroundColor: palette.cyan }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** "How to Earn Points" style list: label on the left, +value on the right, alternating rows. */
export function PointRows({ rows }: { rows: { label: string; value?: string }[] }) {
  return (
    <View style={st.rowsBox}>
      {rows.map((r, i) => (
        <View key={`${i}-${r.label}`} style={[st.row, i % 2 ? st.rowAlt : null]}>
          <Text style={[type.body, { flex: 1 }]}>{r.label}</Text>
          {r.value ? <Text style={st.rowValue} noTranslate>{r.value}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** Panel with a title bar, like "Phase 1  Points: 15,000". */
export function GamePanel({ title, highlight, right, children }: { title: string; highlight?: string; right?: string; children: ReactNode }) {
  return (
    <View style={st.panel}>
      <View style={st.panelBar}>
        <Text style={[type.body, { flex: 1, fontWeight: '600' }]}>{title}{highlight ? <Text style={{ color: GOLD }}>{`  ${highlight}`}</Text> : null}</Text>
        {right ? <Text style={type.caption}>{right}</Text> : null}
      </View>
      <View style={{ padding: space.sm }}>{children}</View>
    </View>
  );
}

/** Compact reward tag: count in gold, then the item name. */
export function ItemSlot({ label }: { label: string }) {
  const m = /^(\d[\d,.]*\s*[x×]\s*|\d[\d,.]*K?\s+)(.*)$/i.exec(label.trim());
  const count = m ? m[1]!.replace(/[x×]/i, '').trim() : '';
  const name = m ? m[2]! : label.trim();
  return (
    <View style={st.slot}>
      {count ? <Text style={st.slotCount} noTranslate>{count}</Text> : null}
      <Text style={st.slotName} numberOfLines={1}>{name}</Text>
    </View>
  );
}

/** Splits "A · B · C" text into point rows when each part ends in a number ("T1 0", "Spire 40,000"). */
export function toPointRows(text: string): { label: string; value?: string }[] | null {
  const parts = text.split(/\s·\s|;\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const rows = parts.map((p) => {
    const m = /^(.*?)[:\s]+(\+?[\d][\d,.]*\s*%?)$/.exec(p.replace(/\.$/, ''));
    return m ? { label: m[1]!.trim(), value: m[2]!.startsWith('+') ? m[2] : `+${m[2]}` } : { label: p };
  });
  return rows.filter((r) => r.value).length >= Math.ceil(rows.length / 2) ? rows : null;
}

const st = StyleSheet.create({
  banner: { marginTop: space.sm, borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', minHeight: 96 },
  ribbon: { marginTop: space.md, marginRight: space.xl, paddingVertical: 8, paddingHorizontal: space.md, backgroundColor: 'rgba(8,14,30,0.85)', borderTopWidth: 1, borderBottomWidth: 1, borderRightWidth: 1, borderTopRightRadius: 18, borderBottomRightRadius: 18 },
  ribbonText: { fontSize: 19, fontWeight: '800', letterSpacing: 0.2 },
  line: { color: palette.text, fontSize: 15, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 3 },
  tabs: { flexDirection: 'row', marginTop: space.md, backgroundColor: DEEP, borderRadius: radius.md, overflow: 'hidden' },
  tab: { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabText: { color: palette.textSecondary, fontWeight: '700', fontSize: 14 },
  tabLine: { height: 3, alignSelf: 'stretch', marginTop: 8, backgroundColor: 'transparent' },
  rowsBox: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, overflow: 'hidden', backgroundColor: DEEP },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: space.md, gap: space.sm },
  rowAlt: { backgroundColor: '#0E1628' },
  rowValue: { color: palette.text, fontWeight: '700', fontVariant: ['tabular-nums'] },
  panel: { marginTop: space.sm, borderWidth: 1, borderColor: '#2A3B66', borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#111A2E' },
  panelBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2A4A', paddingHorizontal: space.md, paddingVertical: 8 },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#1A2744', borderWidth: 1, borderColor: '#2A3B66' },
  slotCount: { color: GOLD, fontWeight: '800', fontSize: 12 },
  slotName: { color: palette.text, fontSize: 12 },
});
