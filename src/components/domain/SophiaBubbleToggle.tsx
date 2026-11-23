import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Switch, Text, View } from 'react-native';
import { palette, space, type } from '@/theme';
import { Card, Row } from '@/components/ui';
import { ensurePermission } from '@/services/notifications';
import { bubbleRunning, bubbleSupported, canShowBubble, openBubblePermission, startBubble, stopBubble } from '@/services/sophiaBubble';

/** Optional on/off switch for the floating Sophia's Test search bubble (Android only; hidden elsewhere). */
export function SophiaBubbleToggle() {
  const [on, setOn] = useState(bubbleRunning());
  const refresh = useCallback(() => setOn(bubbleRunning()), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  if (!bubbleSupported) return null;

  const turnOn = async () => {
    if (!canShowBubble()) {
      Alert.alert(
        'Allow the floating bubble',
        'Android needs "Display over other apps" for Frozen Codex so the search bubble can sit on top of the game. Turn it on, come back, and switch the bubble on again.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Open settings', onPress: openBubblePermission }],
      );
      return;
    }
    await ensurePermission().catch(() => false);
    try {
      await startBubble();
      setOn(true);
    } catch (e) {
      Alert.alert('Could not start the bubble', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card style={{ marginBottom: space.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={type.body}>Floating quick search</Text>
          <Text style={type.caption}>A small bubble over the game. Tap it, type 2–3 words, see the answer. Optional; off by default.</Text>
        </View>
        <Switch
          value={on}
          onValueChange={(v) => { if (v) turnOn().catch(() => undefined); else { stopBubble(); setOn(false); } }}
          trackColor={{ true: palette.cyan, false: palette.border }}
          thumbColor={palette.text}
        />
      </Row>
    </Card>
  );
}
