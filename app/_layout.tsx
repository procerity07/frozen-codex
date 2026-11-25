import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, UIManager, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '@/db/client';
import { useAppStore } from '@/store/useAppStore';
import { palette, space, type } from '@/theme';
import { Button } from '@/components/ui';
import { listHeroes } from '@/db/repo';
import { configureTranslation, protectTerms } from '@/i18n/autoTranslate';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

export default function RootLayout() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const boot = () => {
    setState('loading');
    Promise.all([getDb(), waitForProfile()])
      .then(() => setState('ready'))
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : String(e)); setState('error'); })
      .finally(() => { SplashScreen.hideAsync().catch(() => undefined); });
  };

  const translateMode = useAppStore((s) => s.translateMode);
  useEffect(() => {
    if (state !== 'ready') return;
    configureTranslation(translateMode).catch(() => undefined);
  }, [state, translateMode]);
  useEffect(() => {
    if (state !== 'ready') return;
    listHeroes().then((hs) => protectTerms(hs.map((h) => h.name))).catch(() => undefined);
  }, [state]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.bg).catch(() => undefined);
    boot();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {state === 'ready' ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.bg },
              headerTintColor: palette.text,
              headerTitleStyle: { fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: palette.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
          </Stack>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xxl }}>
            {state === 'loading' ? (
              <>
                <ActivityIndicator color={palette.cyan} />
                <Text style={type.bodySecondary}>Preparing the codex…</Text>
              </>
            ) : (
              <>
                <Text style={type.heading}>Database failed to open</Text>
                <Text style={[type.bodySecondary, { textAlign: 'center' }]}>{error}</Text>
                <Button label="Retry" onPress={boot} />
              </>
            )}
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Resolves once the saved profile has loaded, so first-run setup never flashes for existing users. */
function waitForProfile(): Promise<void> {
  if (useAppStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useAppStore.persist.onFinishHydration(() => { unsub(); resolve(); });
  });
}
