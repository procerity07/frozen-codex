import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ACE_LORD_DAYS_LIKE_DAY1, aceLordDayPhases, aceLordPhases, cycleDays } from '@/data/seed';
import { cycleForDate, formatDuration, msUntilUtcMidnight, utcWeekday } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { palette, radius, space, type } from '@/theme';
import { Chip, ChipRow, CollapsibleSection } from '@/components/ui';
import { GameBanner, GamePanel, ItemSlot, PointRows, toPointRows } from './GameUI';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmt = (n: number) => n.toLocaleString('en-US');

/** Ace Lord laid out like the in-game screen: day header, phase track, how to earn points, phase rewards. */
export function AceLordView() {
  const now = useNow(1000);
  const anchor = useAppStore((s) => s.aceLordAnchorWeek);
  const days = cycleDays.find((c) => c.eventId === 'ace-lord')?.days ?? [];
  const isAceWeek = cycleForDate(now, anchor) === 'Ace Lord';
  const todayIdx = WD.indexOf(utcWeekday(now));
  const [day, setDay] = useState(isAceWeek ? todayIdx + 1 : 1);
  const d = days.find((x) => x.day === day);
  const known = aceLordDayPhases[day] ?? aceLordPhases;
  // Always show phases 1–6; ones not recorded yet show a placeholder.
  const phases = [1, 2, 3, 4, 5, 6].map((n) => known.find((p) => p.phase === n) ?? { phase: n, points: 0, reward: '' });
  const exact = !!aceLordDayPhases[day] || ACE_LORD_DAYS_LIKE_DAY1.includes(day);
  const live = isAceWeek && day === todayIdx + 1;

  return (
    <>
      <GameBanner
        title={`Ace Lord (${day}/7) - ${d?.theme ?? ''}`}
        lines={live
          ? [{ label: 'Time Left', value: formatDuration(msUntilUtcMidnight(now)), color: palette.success }, { label: 'Event ends in', value: formatDuration(msUntilUtcMidnight(now) + (6 - todayIdx) * 86_400_000), color: palette.text }]
          : [{ label: 'Status', value: isAceWeek ? (day < todayIdx + 1 ? 'Finished this week' : `Starts ${WD[day - 1]} 00:00 UTC`) : 'Next Ace Lord week', color: palette.text }]}
      />

      <ChipRow>
        {days.map((x) => <Chip key={x.day} label={`Day ${x.day}`} active={x.day === day} color={isAceWeek && x.day === todayIdx + 1 ? palette.success : palette.gold} onPress={() => setDay(x.day)} />)}
      </ChipRow>

      <Text style={[type.heading, { marginTop: space.md }]}>Phase points</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs }}>
        {phases.map((p) => (
          <View key={p.phase} style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 24, height: 24, borderRadius: 4, transform: [{ rotate: '45deg' }], backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.cyanLine, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[type.caption, { transform: [{ rotate: '-45deg' }], color: palette.text }]}>{p.phase}</Text>
            </View>
            <Text style={[type.caption, { marginTop: 6, fontSize: 10 }]} noTranslate>{!p.points ? '?' : p.points >= 1000 ? `${p.points / 1000}K` : p.points}</Text>
          </View>
        ))}
      </View>

      <CollapsibleSection title="How to Earn Points" initiallyOpen={false}>
      <View style={{ gap: space.sm }}>
        {(d?.scoring ?? []).filter((sc) => !/^(Phases|Daily rank|Total rank)/i.test(sc)).map((sc, i) => {
          const clean = sc.replace(/\s*\(in-game\)/g, '');
          const head = clean.includes(':') ? clean.split(':')[0]! : '';
          const rows = toPointRows(head && head.length < 50 ? clean.slice(head.length + 1) : clean);
          return rows ? <View key={i}>{head && head.length < 50 ? <Text style={[type.caption, { marginBottom: 4 }]}>{head}</Text> : null}<PointRows rows={rows} /></View> : <PointRows key={i} rows={[{ label: clean }]} />;
        })}
      </View>
      </CollapsibleSection>

      <Text style={[type.heading, { marginTop: space.md }]}>Point Rewards</Text>
      {!exact ? <Text style={[type.caption, { color: palette.warning }]}>Rewards for this day not checked in-game yet; showing Day 1.</Text> : null}
      
      {phases.map((p) => (
        <GamePanel key={p.phase} title={`Phase ${p.phase}`} highlight={p.points ? `Points: ${fmt(p.points)}` : 'Not recorded yet'}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {!p.reward ? <Text style={type.caption}>Send a screenshot of this phase to fill it in.</Text> : null}
            {(p.reward ? p.reward.split(/,\s+(?![^()]*\))/) : []).map((r, i) => <ItemSlot key={`${i}-${r}`} label={r.trim()} />)}
          </View>
        </GamePanel>
      ))}
    </>
  );
}
