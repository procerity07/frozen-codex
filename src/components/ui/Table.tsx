import { StyleSheet, Text, View } from 'react-native';
import { palette, space, type } from '@/theme';

export interface Column<T> { key: string; title: string; flex?: number; align?: 'left' | 'right' | 'center'; render: (row: T) => string; color?: (row: T) => string | undefined }

/** Compact tabular-numeral table that never overflows horizontally (flex columns). */
export function Table<T>({ columns, rows, highlight }: { columns: Column<T>[]; rows: T[]; highlight?: (row: T) => boolean }) {
  return (
    <View style={st.table}>
      <View style={[st.row, st.head]}>
        {columns.map((c) => (
          <Text key={c.key} style={[st.headText, { flex: c.flex ?? 1, textAlign: c.align ?? 'left' }]} numberOfLines={1}>{c.title}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[st.row, i % 2 === 1 && st.zebra, highlight?.(r) && st.hl]}>
          {columns.map((c) => (
            <Text key={c.key} style={[st.cell, { flex: c.flex ?? 1, textAlign: c.align ?? 'left', color: c.color?.(r) ?? palette.text }]} numberOfLines={2}>{c.render(r)}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  table: { borderWidth: 1, borderColor: palette.border, borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: space.sm, gap: 6, alignItems: 'center' },
  head: { backgroundColor: palette.modal },
  headText: { ...type.caption, color: palette.textSecondary, fontWeight: '700' },
  zebra: { backgroundColor: 'rgba(255,255,255,0.02)' },
  hl: { backgroundColor: palette.cyanDim },
  cell: { ...type.numberSmall, fontSize: 12 },
});
