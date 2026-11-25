import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Bell, Brain, LayoutGrid, Calculator, Castle, Check, Gift, HeartPulse, Hourglass, Plus, Swords, Timer, Trash, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { checklistTemplate, events, royalArmsRace } from '@/data/seed';
import { elementColors, palette, radius, space, tint, troopColors, type } from '@/theme';
import { Badge, Button, Card, Chip, ChipRow, Field, IconButton, Row, Screen, SectionHeader, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useNow } from '@/store/useNow';
import { formatDuration, royalSlot, utcWeekday } from '@/lib/time';
import { eventsOn, todayThemes } from '@/lib/schedule';
import { scheduleCooldown, ensurePermission } from '@/services/notifications';
import { UpdateBanner } from '@/components/domain/UpdateBanner';
import { AutoWhatsNew, Dashboard } from '@/components/domain/Dashboard';
import { CycleWeekPicker } from '@/components/domain/CycleWeekPicker';

const TOOLS: { label: string; sub: string; icon: LucideIcon; href: Href; color: string }[] = [
  { label: 'My Profile', sub: 'Heroes · bonuses · citadel', icon: User, href: '/tools/profile', color: palette.cyan },
  { label: "Sophia's Test", sub: '30-second lookup', icon: Brain, href: '/tools/sophia', color: palette.cyan },
  { label: 'Gift Code Vault', sub: 'Copy & redeem', icon: Gift, href: '/tools/gift-codes', color: palette.gold },
  { label: 'Bag Hoard', sub: 'Event points', icon: Calculator, href: '/tools/bag', color: elementColors.Dark },
  { label: 'Citadel Planner', sub: 'Deficit & time', icon: Castle, href: '/tools/citadel', color: palette.success },
  { label: 'Troop Training', sub: 'Cost & Sanctuary', icon: HeartPulse, href: '/tools/casualty', color: palette.danger },
  { label: 'War Room', sub: 'CoL · RE · Mail', icon: Swords, href: '/tools/war-room', color: troopColors.Cavalry },
  { label: 'My Reminders', sub: 'Your own alarms', icon: Bell, href: '/tools/reminders', color: palette.gold },
  { label: 'Hive Planner', sub: 'Alliance layout', icon: LayoutGrid, href: '/tools/hive', color: palette.success },
];

export default function HomeScreen() {
  const now = useNow(1000);
  const s = useAppStore();
  const anchors = { aceLordAnchorWeek: s.aceLordAnchorWeek, rotationAnchorWeek: s.rotationAnchorWeek };
  const themes = todayThemes(now, anchors);
  const weekday = utcWeekday(now);
  const todayEvents = eventsOn(events, now, anchors).filter((e) => e.category !== 'Core Cycle');
  const slot = royalSlot(now);
  const rar = ['Thu', 'Fri', 'Sat', 'Sun'].includes(weekday) ? royalArmsRace.find((r) => r.slot === slot) : undefined;

  return (
    <Screen>
      <UpdateBanner />
      <AutoWhatsNew />
      <Card style={{ marginTop: space.xs }}>
        <Text style={type.caption}>Current realm cycle</Text>
        <View style={{ marginTop: space.sm }}>
          <CycleWeekPicker now={now} />
        </View>
        <View style={{ marginTop: space.md, gap: space.sm }}>
          {themes.map((t) => (
            <Pressable key={t.label} onPress={() => router.push(`/event/${t.eventId}`)} style={st.theme}>
              <Text style={type.caption}>{t.label}</Text>
              <Text style={type.heading}>{t.theme}</Text>
            </Pressable>
          ))}
          {rar ? (
            <View style={[st.theme, { borderColor: palette.goldLine }]}>
              <Text style={[type.caption, { color: palette.gold }]}>Royal Arms Race · Slot {slot} · {royalArmsRace[slot - 1]!.utc} UTC</Text>
              <Text style={type.body}>One of: {rar.themes.join(' · ')}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <SectionHeader title="Quick tools" />
      <View style={st.grid}>
        {TOOLS.map((t) => (
          <Pressable key={t.label} onPress={() => { haptic(); router.push(t.href); }} style={({ pressed }) => [st.tool, pressed && { opacity: 0.75 }]} accessibilityRole="button">
            <View style={[st.toolIcon, { backgroundColor: tint(t.color, 0.14) }]}><t.icon size={18} color={t.color} /></View>
            <Text style={[type.body, { fontWeight: '600' }]} numberOfLines={1}>{t.label}</Text>
            <Text style={type.caption} numberOfLines={1}>{t.sub}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Live today" subtitle={`${weekday} · ${todayEvents.length} events`} right={<Button compact variant="secondary" label="Calendar" onPress={() => router.push('/events')} />} />
      <ChipRow>
        {todayEvents.map((e) => <Chip key={e.id} label={e.name} onPress={() => router.push(`/event/${e.id}`)} />)}
      </ChipRow>

      <SectionHeader title="At a glance" />
      <Dashboard now={now} />

      <DailyChecklist now={now} />
    </Screen>
  );
}

function DailyChecklist({ now }: { now: Date }) {
  const castles = useAppStore((x) => x.castles);
  const checklist = useAppStore((x) => x.checklist);
  const cooldowns = useAppStore((x) => x.cooldowns);
  const toggleCheck = useAppStore((x) => x.toggleCheck);
  const startCooldown = useAppStore((x) => x.startCooldown);
  const addCastle = useAppStore((x) => x.addCastle);
  const removeCastle = useAppStore((x) => x.removeCastle);
  const [castleId, setCastleId] = useState(castles[0]?.id ?? 'main');
  const [newName, setNewName] = useState('');
  const todayKey = now.toISOString().slice(0, 10);
  const done = checklist.dateKey === todayKey ? checklist.done : {};
  const castle = castles.find((c) => c.id === castleId) ?? castles[0]!;
  const items = checklistTemplate.filter((i) => i.castle === 'all' || castle.kind === 'main');
  const completed = items.filter((i) => done[`${castle.id}:${i.id}`]).length;

  return (
    <>
      <SectionHeader title="Daily checklist" subtitle={`${completed}/${items.length} done on ${castle.name} · resets 00:00 UTC`} />
      <ChipRow>
        {castles.map((c) => <Chip key={c.id} label={c.name} active={c.id === castle.id} onPress={() => setCastleId(c.id)} color={c.kind === 'main' ? palette.gold : palette.cyan} />)}
      </ChipRow>
      <Card style={{ paddingVertical: space.xs }}>
        {items.map((i, idx) => {
          const key = `${castle.id}:${i.id}`;
          const isDone = !!done[key];
          const started = cooldowns[key];
          const remaining = i.cooldownHours && started ? started + i.cooldownHours * 3600_000 - now.getTime() : 0;
          return (
            <View key={i.id} style={[st.checkRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border }]}>
              <Pressable onPress={() => { haptic(); toggleCheck(castle.id, i.id, todayKey); }} style={st.checkHit} accessibilityRole="checkbox" accessibilityState={{ checked: isDone }}>
                <View style={[st.box, isDone && st.boxOn]}>{isDone ? <Check size={14} color={palette.bg} strokeWidth={3} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '600' }, isDone && { color: palette.textMuted, textDecorationLine: 'line-through' }]}>{i.label}</Text>
                  <Text style={type.caption}>{i.detail}</Text>
                </View>
              </Pressable>
              {i.cooldownHours ? (
                remaining > 0 ? (
                  <Row gap={4}><Hourglass size={13} color={palette.gold} /><Text style={[type.numberSmall, { color: palette.gold }]}>{formatDuration(remaining)}</Text></Row>
                ) : (
                  <IconButton icon={Timer} label="Start cooldown" color={palette.cyan} onPress={async () => {
                    startCooldown(castle.id, i.id, Date.now());
                    if (await ensurePermission()) await scheduleCooldown(key, `${i.label} ready · ${castle.name}`, i.cooldownHours! * 3600);
                  }} />
                )
              ) : null}
            </View>
          );
        })}
      </Card>
      <Row style={{ marginTop: space.md }}>
        <Field placeholder="Farm castle name" value={newName} onChangeText={setNewName} />
        <IconButton icon={Plus} label="Add farm castle" color={palette.cyan} onPress={() => { addCastle(newName); setNewName(''); }} />
        {castle.kind === 'farm' ? <IconButton icon={Trash} label="Remove castle" color={palette.danger} onPress={() => { removeCastle(castle.id); setCastleId('main'); }} /> : null}
      </Row>
      <Row style={{ marginTop: space.sm }}><Badge label="Tip" color={palette.gold} /><Text style={[type.caption, { flex: 1 }]}>Use one essence for the daily quest and bank the rest for Ace Lord Day 6.</Text></Row>
    </>
  );
}

const st = StyleSheet.create({
  theme: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: space.md, backgroundColor: palette.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tool: { width: '31.5%', flexGrow: 1, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: space.md, gap: 4 },
  toolIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  checkHit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: palette.borderStrong, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: palette.cyan, borderColor: palette.cyan },
});
