import { Text, View } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import type { GameEvent } from '@/types/game';
import { nextRun } from '@/lib/todayEvents';
import { formatDuration } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { palette, space, type } from '@/theme';
import { Badge, Button, Card, Row } from '@/components/ui';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = (d: Date) => `${WD[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Game-style header: name, live / starts-in countdown, top rewards and the alarm button. */
export function EventHeader({ ev, alarmOn, onAlarm, alarmLabel, canAlarm }: { ev: GameEvent; alarmOn: boolean; onAlarm: () => void; alarmLabel: string; canAlarm: boolean }) {
  const now = useNow(1000);
  const s = useAppStore();
  const run = nextRun(ev, now, { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek }, s.allianceTimes);
  const live = run?.status === 'live';
  return (
    <Card style={{ marginTop: space.sm, borderColor: live ? palette.success : palette.goldLine }}>
      <Text style={[type.heading, { color: palette.gold, fontSize: 20 }]}>{ev.name}</Text>
      {run ? (
        <Text style={[type.body, { marginTop: 4, color: live ? palette.success : palette.text, fontWeight: '600' }]} noTranslate={false}>
          {live ? `Live now · time left ${formatDuration(run.end.getTime() - now.getTime())}` : `Starts in ${formatDuration(run.start.getTime() - now.getTime())} · ${hhmm(run.start)} your time`}
        </Text>
      ) : <Text style={[type.body, { marginTop: 4 }]}>{ev.cadence}</Text>}
      {run?.allianceTime ? <Text style={[type.caption, { color: palette.gold }]}>Using your alliance's time</Text> : null}
      <Row style={{ flexWrap: 'wrap', marginTop: space.sm }}>
        <Badge label={ev.category} color={palette.cyan} />
        <Badge label={ev.cycleWeek === 'Both' ? 'Every week' : ev.cycleWeek === 'Random' ? 'Random' : `${ev.cycleWeek} Week`} color={palette.gold} />
      </Row>
      {canAlarm ? (
        <View style={{ marginTop: space.md }}>
          <Button compact variant={alarmOn ? 'secondary' : 'primary'} icon={alarmOn ? BellOff : Bell} label={alarmLabel} onPress={onAlarm} />
        </View>
      ) : null}
    </Card>
  );
}
