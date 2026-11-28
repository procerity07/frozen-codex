import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, RotateCcw, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { palette, radius, space, troopColors, type } from '@/theme';
import type { TroopFocus } from '@/types/game';
import { cycleForDate, formatDuration, msUntilUtcMidnight, utcClock } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { TroopEmblem, haptic } from '@/components/ui';

const FOCI: TroopFocus[] = ['Infantry', 'Cavalry', 'Archer', 'All'];

function CommanderBarImpl() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const focus = useAppStore((s) => s.troopFocus);
  const setFocus = useAppStore((s) => s.setTroopFocus);
  const anchor = useAppStore((s) => s.aceLordAnchorWeek);
  const cycle = cycleForDate(now, anchor);

  return (
    <View style={[st.wrap, { paddingTop: insets.top + space.sm }]}>
      <View style={st.topRow}>
        <View style={st.clockBlock}>
          <Clock size={14} color={palette.cyan} />
          <Text style={st.clock} accessibilityLabel="Server time UTC">{utcClock(now)}</Text>
          <Text style={st.utc}>UTC+0</Text>
        </View>
        <View style={st.resetBlock}>
          <RotateCcw size={13} color={palette.gold} />
          <Text style={st.reset}>{formatDuration(msUntilUtcMidnight(now))}</Text>
        </View>
        <Pressable onPress={() => { haptic(); router.push('/tools/search'); }} accessibilityRole="button" accessibilityLabel="Search everything" hitSlop={8} style={st.searchBtn}>
          <Search size={16} color={palette.cyan} />
        </Pressable>
        <View style={[st.cycle, { borderColor: cycle === 'Ace Lord' ? palette.goldLine : palette.cyanLine }]}>
          <Text style={[st.cycleText, { color: cycle === 'Ace Lord' ? palette.gold : palette.cyan }]} numberOfLines={1}>{cycle}</Text>
        </View>
      </View>
      <View style={st.focusRow} accessibilityRole="radiogroup" accessibilityLabel="Main troop focus">
        {FOCI.map((f) => {
          const active = f === focus;
          return (
            <Pressable
              key={f}
              onPress={() => { haptic(); setFocus(f); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[st.focus, active && { borderColor: troopColors[f], backgroundColor: palette.modal }]}
            >
              <TroopEmblem type={f} size={16} />
              <Text style={[st.focusText, active && { color: palette.text }]} numberOfLines={1}>{f}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const CommanderBar = memo(CommanderBarImpl);

const st = StyleSheet.create({
  searchBtn: { padding: 6, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border },
  wrap: { backgroundColor: palette.surface, paddingHorizontal: space.lg, paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: palette.goldLine },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  clockBlock: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  clock: { ...type.number, fontSize: 17 },
  utc: { ...type.caption, color: palette.textMuted },
  resetBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reset: { ...type.numberSmall, color: palette.gold, fontSize: 13 },
  cycle: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 96 },
  cycleText: { fontSize: 11, fontWeight: '700' },
  focusRow: { flexDirection: 'row', gap: 6, marginTop: space.sm },
  focus: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  focusText: { fontSize: 12, fontWeight: '600', color: palette.textMuted },
});
