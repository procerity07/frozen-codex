import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { CalendarClock, ChevronRight, ClipboardCheck, Crown, Gift, Swords } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { checklistTemplate, events, giftCodes, royalArmsRace } from '@/data/seed';
import { todayThemes, type Anchors } from '@/lib/schedule';
import { formatDuration, royalSlot, utcWeekday } from '@/lib/time';
import { todayEventRows } from '@/lib/todayEvents';
import { useAppStore } from '@/store/useAppStore';
import { palette, radius, space, tint, type } from '@/theme';
import { Card, SectionHeader, haptic } from '@/components/ui';

interface Step { icon: LucideIcon; color: string; title: string; detail: string; href: Href; done?: boolean }

/** "What to do today": the day's actions in one list, each a tap away. */
export function TodayPlan({ now }: { now: Date }) {
  const s = useAppStore();
  const anchors: Anchors = { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek };
  const steps: Step[] = [];

  // 1. Today's cycle theme (Ace Lord / Arms Race day).
  const theme = todayThemes(now, anchors)[0];
  if (theme) steps.push({ icon: Crown, color: palette.gold, title: `${theme.label}: ${theme.theme}`, detail: 'See what scores points today', href: `/event/${theme.eventId}` });

  // 2. Royal Arms Race slot right now.
  if (['Thu', 'Fri', 'Sat'].includes(utcWeekday(now))) {
    const slot = royalSlot(now);
    const r = royalArmsRace.find((x) => x.slot === slot);
    if (r) steps.push({ icon: Swords, color: palette.gold, title: `Royal Arms Race slot ${slot}`, detail: `One of: ${r.themes.slice(0, 3).join(', ')}…`, href: '/event/royal-arms-race' });
  }

  // 3. Next event to start (your alliance's time if set).
  const next = todayEventRows(events, now, anchors, s.allianceTimes).find((r) => r.status === 'upcoming');
  if (next) steps.push({ icon: CalendarClock, color: palette.cyan, title: `${next.ev.name} starts in ${formatDuration(next.start.getTime() - now.getTime())}`, detail: next.allianceTime ? "Your alliance's time" : 'Open for rules and rewards', href: `/event/${next.ev.id}` });

  // 4. Gift codes not redeemed yet.
  const open = giftCodes.filter((c) => c.status === 'active' && !s.claimedCodes.includes(c.code)).length;
  steps.push(open
    ? { icon: Gift, color: palette.success, title: `Redeem ${open} gift code${open === 1 ? '' : 's'}`, detail: 'Tap a code to copy it', href: '/tools/gift-codes' }
    : { icon: Gift, color: palette.success, title: 'All gift codes redeemed', detail: 'Check again later', href: '/tools/gift-codes', done: true });

  // 5. Daily checklist on the main castle.
  const todayKey = now.toISOString().slice(0, 10);
  const doneMap = s.checklist.dateKey === todayKey ? s.checklist.done : {};
  const items = checklistTemplate;
  const left = items.filter((i) => !doneMap[`main:${i.id}`]).length;
  steps.push({ icon: ClipboardCheck, color: palette.cyan, title: left ? `${left} daily task${left === 1 ? '' : 's'} left` : 'Daily checklist done', detail: 'Main castle · resets 00:00 UTC', href: '/' as Href, done: !left });

  return (
    <>
      <SectionHeader title="Today" subtitle="Your day, step by step" />
      <Card style={{ paddingVertical: space.xs }}>
        {steps.map((st, i) => (
          <Pressable key={st.title} onPress={() => { haptic(); if (st.href !== '/') router.push(st.href); }} accessibilityRole="button"
            style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm, borderTopWidth: i ? 1 : 0, borderTopColor: palette.border, opacity: st.done ? 0.55 : 1 }, pressed && { opacity: 0.7 }]}>
            <View style={{ width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(st.color, 0.14) }}>
              <st.icon size={16} color={st.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '600' }]} numberOfLines={2}>{st.title}</Text>
              <Text style={type.caption} numberOfLines={1}>{st.detail}</Text>
            </View>
            {st.href !== '/' ? <ChevronRight size={16} color={palette.textMuted} /> : null}
          </Pressable>
        ))}
      </Card>
    </>
  );
}
