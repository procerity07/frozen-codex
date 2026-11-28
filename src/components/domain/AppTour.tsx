import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { CURRENT_VERSION } from '@/services/appUpdate';
import { useAppStore } from '@/store/useAppStore';
import { palette, radius, space, type } from '@/theme';

/** One step per tab, in tab-bar order. */
export const TOUR_STEPS: { tab: string; href: Href; title: string; text: string }[] = [
  { tab: 'Home', href: '/', title: 'Home', text: 'Your day step by step: today\'s theme, next event, gift codes and daily tasks. Search everything with the magnifier at the top.' },
  { tab: 'Heroes', href: '/heroes', title: 'Heroes', text: 'Look up any hero. Tap "I own this hero" to add them. This powers your march and bonuses.' },
  { tab: 'Events', href: '/events', title: 'Events', text: "The weekly schedule, every event's rules and rewards, plus Sophia, Event Points and Battle Guides. Set your alliance's event times here." },
  { tab: 'Progress', href: '/progression', title: 'Progress', text: 'Citadel, gear, runes, totems and dragon data, with the Citadel Planner and Troop Training at the top.' },
  { tab: 'Guides', href: '/guides', title: 'Guides', text: 'Step-by-step playbooks for events and systems.' },
  { tab: 'Profile', href: '/profile', title: 'Profile', text: 'Your recommended march, heroes, total bonuses, Lord Details stats, the Hive Planner and ⚙️ Settings.' },
];

const TAB_BAR_HEIGHT = 60;

/** Shown once after first-time setup (and after "What's new"), pointing at each tab in turn. */
export function AppTour() {
  const done = useAppStore((s) => s.tourDone);
  const seen = useAppStore((s) => s.seenWhatsNew);
  const setDone = useAppStore((s) => s.setTourDone);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  if (done || seen !== CURRENT_VERSION) return null;

  const s = TOUR_STEPS[step]!;
  const last = step === TOUR_STEPS.length - 1;
  const finish = () => { setDone(true); setStep(0); router.navigate('/'); };
  const go = (i: number) => { setStep(i); router.navigate(TOUR_STEPS[i]!.href); };
  const slot = 100 / TOUR_STEPS.length;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={finish}>
      <View style={st.dim} />
      <View style={[st.bubble, { bottom: TAB_BAR_HEIGHT + insets.bottom + 18 }]}>
        <Text style={type.caption}>{`${step + 1} of ${TOUR_STEPS.length}`}</Text>
        <Text style={[type.heading, { marginTop: 2 }]}>{s.title}</Text>
        <Text style={[type.body, { marginTop: space.xs }]}>{s.text}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button compact variant="ghost" label="Skip" onPress={finish} /></View>
          {step > 0 ? <View style={{ flex: 1 }}><Button compact variant="secondary" label="Back" onPress={() => go(step - 1)} /></View> : null}
          <View style={{ flex: 1 }}><Button compact label={last ? 'Done' : 'Next'} onPress={() => (last ? finish() : go(step + 1))} /></View>
        </View>
      </View>
      {/* Ring around the tab being described. */}
      <Pressable
        onPress={() => (last ? finish() : go(step + 1))}
        style={[st.ring, { left: `${slot * step}%`, width: `${slot}%`, bottom: insets.bottom + 2, height: TAB_BAR_HEIGHT - 4 }]}
        accessibilityLabel={`${s.tab} tab`}
      />
    </Modal>
  );
}

const st = StyleSheet.create({
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  bubble: { position: 'absolute', left: space.lg, right: space.lg, backgroundColor: palette.surface, borderColor: palette.cyan, borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
  ring: { position: 'absolute', borderWidth: 2, borderColor: palette.cyan, borderRadius: radius.lg },
});
