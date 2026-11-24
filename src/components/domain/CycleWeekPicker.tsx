import { Pressable, StyleSheet, Text, View } from 'react-native';
import { events } from '@/data/seed';
import { palette, radius, space, type } from '@/theme';
import { Row, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { cycleForDate, rotationWeek } from '@/lib/time';

const WEEKS = [1, 2, 3, 4] as const;
const cycleOf = (w: number) => (w % 2 === 1 ? 'Ace Lord' : 'Arms Race');
/** Events that only run in one week of the 4-week rotation, by week. */
export const rotationEvents = (w: number) => events.filter((e) => e.rotationWeek === w).map((e) => e.name);

/**
 * One picker for the realm's 4-week rotation. Weeks 1 and 3 are Ace Lord weeks, 2 and 4 Arms Race
 * weeks, so choosing the week also sets the cycle. Shows what is special about each week.
 */
export function CycleWeekPicker({ now, compact }: { now: Date; compact?: boolean }) {
  const s = useAppStore();
  const cur = rotationWeek(now, s.rotationAnchorWeek);
  const cycle = cycleForDate(now, s.aceLordAnchorWeek);
  const consistent = cycleOf(cur) === cycle;
  const special = rotationEvents(cur);
  return (
    <View>
      <Row gap={6}>
        {WEEKS.map((w) => {
          const on = w === cur && consistent;
          return (
            <Pressable key={w} onPress={() => { haptic(); s.setCycleWeek(now, w); }} style={[st.week, on && st.weekOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[type.numberSmall, on && { color: palette.text }]}>Week {w}</Text>
              <Text style={[type.caption, { fontSize: 10 }, on && { color: palette.text }]}>{cycleOf(w)}</Text>
            </Pressable>
          );
        })}
      </Row>
      {!consistent ? (
        <Text style={[type.caption, { marginTop: space.sm, color: palette.warning }]}>Tap this week's number to fix your cycle (weeks 1 and 3 are Ace Lord, 2 and 4 Arms Race).</Text>
      ) : (
        <Text style={[type.caption, { marginTop: space.sm }]}>
          {cycle} week{special.length ? ` · only this week: ${special.join(', ')}` : ''}{compact ? '' : ` · ${cycle === 'Ace Lord' ? 'Conquest of Lords' : 'Realm Expedition'} on Saturday`}
        </Text>
      )}
      {compact ? null : (
        <Text style={[type.caption, { marginTop: 4 }]}>
          Not sure? Check the in-game events: {WEEKS.map((w) => `${rotationEvents(w).join(' / ') || '—'} = week ${w}`).join('; ')}.
        </Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  week: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  weekOn: { borderColor: palette.cyan, backgroundColor: palette.cyanDim },
});
