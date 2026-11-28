import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ACE_LORD_DAYS_LIKE_DAY1, aceLordDayPhases, aceLordPhases, cycleDays } from '@/data/seed';
import { cycleForDate, formatDuration, msUntilUtcMidnight, utcWeekday } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { palette, radius, space, type } from '@/theme';
import { Badge, Card, Chip, ChipRow } from '@/components/ui';

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
  const phases = aceLordDayPhases[day] ?? aceLordPhases;
  const exact = !!aceLordDayPhases[day] || ACE_LORD_DAYS_LIKE_DAY1.includes(day);
  const live = isAceWeek && day === todayIdx + 1;

  return (
    <>
      <Card style={{ marginTop: space.sm, borderColor: palette.goldLine }}>
        <Text style={[type.heading, { color: palette.gold }]}>{`Ace Lord (${day}/7) - ${d?.theme ?? ''}`}</Text>
        {live ? (
          <>
            <Text style={[type.body, { marginTop: 4 }]}>{`Time left: ${formatDuration(msUntilUtcMidnight(now))}`}</Text>
            <Text style={type.caption}>{`Event ends in ${formatDuration(msUntilUtcMidnight(now) + (6 - todayIdx) * 86_400_000)}`}</Text>
          </>
        ) : <Text style={[type.caption, { marginTop: 4 }]}>{isAceWeek ? (day < todayIdx + 1 ? 'Finished this week' : `Starts ${WD[day - 1]} 00:00 UTC`) : 'Next Ace Lord week'}</Text>}
      </Card>

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
            <Text style={[type.caption, { marginTop: 6, fontSize: 10 }]} noTranslate>{p.points >= 1000 ? `${p.points / 1000}K` : p.points}</Text>
          </View>
        ))}
      </View>

      <Text style={[type.heading, { marginTop: space.md }]}>How to earn points</Text>
      <Card style={{ marginTop: space.xs }}>
        {(d?.scoring ?? []).filter((sc) => !/^Phases/i.test(sc)).map((sc, i) => <Text key={i} style={[type.body, { marginBottom: 4 }]}>{`• ${sc.replace(/\s*\(in-game\)/g, '')}`}</Text>)}
      </Card>

      <Text style={[type.heading, { marginTop: space.md }]}>Point reward</Text>
      {!exact ? <Text style={[type.caption, { color: palette.warning }]}>Rewards for this day not checked in-game yet; showing Day 1.</Text> : null}
      {phases.map((p) => (
        <View key={p.phase} style={{ marginTop: space.xs, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: palette.surface, paddingHorizontal: space.md, paddingVertical: 6 }}>
            <Text style={type.body}>{`Phase ${p.phase} `}<Text style={{ color: palette.gold }} noTranslate>{`Points: ${fmt(p.points)}`}</Text></Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: space.sm }}>
            {p.reward.split(/,\s+(?![^()]*\))/).map((r, i) => <Badge key={`${i}-${r}`} label={r.trim()} color={palette.text} />)}
          </View>
        </View>
      ))}
    </>
  );
}
