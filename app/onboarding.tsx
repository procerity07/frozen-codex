import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Bell, Check, Crown, Search } from 'lucide-react-native';
import { palette, space, type } from '@/theme';
import { Button, Card, Field, NumberField, Row, Segmented } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { ensurePermission, scheduleDailyReset } from '@/services/notifications';
import type { TroopFocus } from '@/types/game';
import { CycleWeekPicker } from '@/components/domain/CycleWeekPicker';
import { CURRENT_VERSION } from '@/services/appUpdate';

const STEPS = 3;
const FOCUS: readonly TroopFocus[] = ['Infantry', 'Cavalry', 'Archer', 'All'];
const CITADEL_MAX = 40;

/** First-run setup: realm, account basics and this week's cycle. Every step can be skipped and changed later in Settings. */
export default function Onboarding() {
  const s = useAppStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const now = new Date();
  const [reminder, setReminder] = useState(!!s.alarms['daily-reset']);

  const finish = () => {
    s.setOnboarded(true);
    s.setSeenWhatsNew(CURRENT_VERSION);
    router.replace('/');
  };

  const toggleReminder = async () => {
    const on = !reminder;
    if (on && !(await ensurePermission())) return;
    await scheduleDailyReset(on, s.alarmLeadMinutes).catch(() => undefined);
    s.setAlarm('daily-reset', on);
    setReminder(on);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.md }}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <Row style={{ paddingHorizontal: space.lg, justifyContent: 'space-between', alignItems: 'center' }}>
        <Row gap={6}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? palette.cyan : palette.border }} />
          ))}
        </Row>
        <Button compact variant="ghost" label="Skip" onPress={finish} />
      </Row>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <>
            <Text style={type.title}>Welcome to Frozen Codex</Text>
            <Text style={type.bodySecondary}>
              Your offline companion for Puzzles & Chaos: Frozen Castle. Three quick questions make the schedule, calculators and advice match your account. Everything can be changed later in Settings.
            </Text>
            <Card>
              <Text style={type.heading}>Your realm</Text>
              <Row style={{ marginTop: space.sm }}>
                <Field label="Realm #" value={s.realm.number} onChangeText={(v) => s.setRealm({ number: v })} keyboardType="numeric" placeholder="e.g. 412" />
                <NumberField label="Realm age (weeks)" value={s.realm.ageWeeks} onChange={(n) => s.setRealm({ ageWeeks: Math.max(0, n) })} />
              </Row>
              <View style={{ marginTop: space.sm }}>
                <Field label="Lord name (optional)" value={s.realm.lordName} onChangeText={(v) => s.setRealm({ lordName: v })} autoCapitalize="none" />
              </View>
              <Text style={[type.caption, { marginTop: space.sm }]}>Realm age decides which Hero Choice Cards and Ace Lord rewards apply to you. Find it in-game on your realm info.</Text>
            </Card>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={type.title}>Your account</Text>
            <Card>
              <Text style={type.heading}>Citadel level</Text>
              <View style={{ marginTop: space.sm }}>
                <NumberField label={`Current Citadel (1–${CITADEL_MAX})`} value={s.citadel.from} onChange={(n) => {
                  const from = Math.min(CITADEL_MAX, Math.max(1, n || 1));
                  s.setCitadel({ from, to: Math.max(from, Math.min(CITADEL_MAX, s.citadel.to)) });
                }} />
              </View>
              <Text style={[type.caption, { marginTop: space.sm }]}>Pre-fills the Citadel upgrade calculator.</Text>
            </Card>
            <Card>
              <Text style={type.heading}>Main troop type</Text>
              <View style={{ marginTop: space.sm }}>
                <Segmented options={FOCUS} value={s.troopFocus} onChange={s.setTroopFocus} labels={{ All: 'Mixed' }} />
              </View>
              <Text style={[type.caption, { marginTop: space.sm }]}>Highlights heroes and advice for the troops you build most.</Text>
            </Card>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={type.title}>This week</Text>
            <Card>
              <Text style={type.heading}>Which week of the cycle is it?</Text>
              <Text style={[type.caption, { marginTop: 4 }]}>Your realm runs a 4-week rotation: weeks 1 and 3 are Ace Lord weeks, 2 and 4 Arms Race weeks. Check which special events are on in-game.</Text>
              <View style={{ marginTop: space.sm }}>
                <CycleWeekPicker now={now} />
              </View>
              <Text style={[type.caption, { marginTop: space.sm }]}>The event calendar uses this to show the right events every week.</Text>
            </Card>
            <Card>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.heading}>Daily reset reminder</Text>
                  <Text style={type.caption}>A notification {s.alarmLeadMinutes} min before 00:00 UTC.</Text>
                </View>
                <Button compact icon={reminder ? Check : Bell} variant={reminder ? 'secondary' : 'primary'} label={reminder ? 'On' : 'Turn on'} onPress={() => { toggleReminder().catch(() => undefined); }} />
              </Row>
            </Card>
            <Card>
              <Text style={type.heading}>Tips</Text>
              <Row style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                <Crown color={palette.gold} size={16} />
                <Text style={[type.bodySecondary, { flex: 1 }]}>Open any hero and tap "I own this hero" to build your roster and see your bonuses in My Heroes.</Text>
              </Row>
              <Row style={{ marginTop: space.sm, alignItems: 'flex-start' }}>
                <Search color={palette.cyan} size={16} />
                <Text style={[type.bodySecondary, { flex: 1 }]}>Sophia's Test (Command tab, tools) has the answers, plus an optional floating search bubble to use over the game.</Text>
              </Row>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <Row style={{ paddingHorizontal: space.lg }}>
        {step > 0 ? <View style={{ flex: 1 }}><Button icon={ArrowLeft} variant="secondary" label="Back" onPress={() => setStep(step - 1)} /></View> : null}
        <View style={{ flex: 1 }}>
          {step < STEPS - 1
            ? <Button icon={ArrowRight} label="Next" onPress={() => setStep(step + 1)} />
            : <Button icon={Check} variant="gold" label="Start" onPress={finish} />}
        </View>
      </Row>
    </View>
  );
}
