import { Text, View } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import type { GameEvent } from '@/types/game';
import { nextRun } from '@/lib/todayEvents';
import { formatDuration } from '@/lib/time';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { palette, space, type } from '@/theme';
import { Badge, Button, Row } from '@/components/ui';
import { GameBanner } from './GameUI';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = (d: Date) => `${WD[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Game-style header: name, live / starts-in countdown, top rewards and the alarm button. */
export function EventHeader({ ev, alarmOn, onAlarm, alarmLabel, canAlarm }: { ev: GameEvent; alarmOn: boolean; onAlarm: () => void; alarmLabel: string; canAlarm: boolean }) {
  const now = useNow(1000);
  const s = useAppStore();
  const run = nextRun(ev, now, { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek }, s.allianceTimes);
  const live = run?.status === 'live';
  const lines = run
    ? live
      ? [{ label: 'Time Left', value: formatDuration(run.end.getTime() - now.getTime()), color: palette.success }]
      : [{ label: 'Starts in', value: formatDuration(run.start.getTime() - now.getTime()) }, { label: 'Your time', value: hhmm(run.start), color: palette.text }]
    : [{ label: 'When', value: ev.cadence, color: palette.text }];
  return (
    <GameBanner title={ev.name} lines={lines} accent={live ? palette.success : undefined}>
      {run?.allianceTime ? <Text style={[type.caption, { color: palette.gold }]}>Using your alliance's time</Text> : null}
      <Row style={{ flexWrap: 'wrap', marginTop: space.xs }}>
        <Badge label={ev.category} color={palette.cyan} />
        <Badge label={ev.cycleWeek === 'Both' ? 'Every week' : ev.cycleWeek === 'Random' ? 'Random' : `${ev.cycleWeek} Week`} color={palette.gold} />
      </Row>
      {canAlarm ? (
        <View style={{ marginTop: space.sm }}>
          <Button compact variant={alarmOn ? 'secondary' : 'primary'} icon={alarmOn ? BellOff : Bell} label={alarmLabel} onPress={onAlarm} />
        </View>
      ) : null}
    </GameBanner>
  );
}
