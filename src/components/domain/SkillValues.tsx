import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { RosterEntry } from '@/lib/roster';
import { enhancementLabel } from '@/lib/roster';
import { currentTier, type TierGrid } from '@/lib/tiers';
import { palette, radius, space, type } from '@/theme';

const LABELS = ['Hero0', '+1', '+2', '+3', '+4', '+5', '+6', '+7', '+8'];
const fmt = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/** Current value for the player's hero, with the full per-level grid folded underneath. */
export function SkillValues({ grid, entry, unit = '%', lockedAt }: { grid: TierGrid; entry?: RosterEntry; unit?: string; lockedAt?: number }) {
  const [open, setOpen] = useState(false);
  const cols = LABELS.map((_, i) => i).filter((i) => Object.values(grid).some((r) => r[i] != null));
  const rows = Object.keys(grid).sort();
  const now = entry ? currentTier(grid, entry.stars, entry.enhancement) : null;
  const u = unit === '%' ? '%' : '';
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {entry ? (
          <Text style={[type.body, { color: lockedAt ? palette.warning : now == null ? palette.textMuted : palette.success, fontWeight: '600' }]} noTranslate>
            {lockedAt ? `Unlocks at Lv. ${lockedAt} (now Lv. ${entry.level})` : now == null ? `Not active at ${entry.stars}★ ${enhancementLabel(entry.enhancement)}` : `${fmt(now)}${u} now (${entry.stars}★ ${enhancementLabel(entry.enhancement)})`}
          </Text>
        ) : <View />}
        <Pressable onPress={() => setOpen(!open)} hitSlop={8} accessibilityRole="button" accessibilityState={{ expanded: open }}>
          <Text style={[type.caption, { color: palette.cyan }]}>{open ? 'Hide levels' : 'All levels'}</Text>
        </Pressable>
      </View>
      {open ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.xs }}>
          <View style={{ borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={[type.caption, cell, { width: 34 }]}> </Text>
              {cols.map((c) => <Text key={c} style={[type.caption, cell]}>{LABELS[c]}</Text>)}
            </View>
            {rows.map((st) => (
              <View key={st} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: palette.border }}>
                <Text style={[type.caption, cell, { width: 34, color: palette.gold }]}>{st === '*' ? 'All' : `${st}★`}</Text>
                {cols.map((c) => {
                  const v = grid[st]![c];
                  const here = !!entry && c === entry.enhancement && (st === String(entry.stars) || (st === '*'));
                  return (
                    <Text key={c} noTranslate style={[type.caption, cell, { color: v == null ? palette.textMuted : palette.text }, here && { backgroundColor: palette.cyanLine, color: palette.text, fontWeight: '700' }]}>
                      {v == null ? '—' : `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}${u}`}
                    </Text>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const cell = { width: 58, textAlign: 'center' as const, paddingVertical: 4 };
