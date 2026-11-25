import { useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { Languages } from 'lucide-react-native';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { palette, space, type } from '@/theme';
import { TRANSLATE_LANGUAGES, clearTranslationCache, deviceLanguage, getStatus, subscribe, translateAvailable } from '@/i18n/autoTranslate';

const STATUS_TEXT = {
  off: 'Showing English.',
  unavailable: 'This language is not available for on-device translation, or this build does not include the translator yet.',
  downloading: 'Downloading the translator for this language (about 30 MB, only once)…',
  ready: 'On. Text is translated on your phone as you open screens; the first view of a screen may show English for a moment.',
  failed: 'The translator could not be downloaded. Check your internet connection, then pick the language again.',
} as const;

export function TranslateCard() {
  const mode = useAppStore((s) => s.translateMode);
  const setMode = useAppStore((s) => s.setTranslateMode);
  const status = useSyncExternalStore((l) => subscribe(l), getStatus);
  const phone = deviceLanguage();
  const phoneName = TRANSLATE_LANGUAGES.find((l) => l.tag === phone)?.name ?? (phone === 'en' ? 'English' : phone);

  return (
    <>
      <SectionHeader title="Language" icon={Languages} subtitle="Automatic translation done on your phone by Google's offline translator" />
      <Card>
        <Text style={type.caption} noTranslate>
          {`Phone language: ${phoneName}`}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm }}>
          <Chip label={`Auto (${phoneName})`} active={mode === 'auto'} onPress={() => setMode('auto')} />
          <Chip label="English" active={mode === 'off'} onPress={() => setMode('off')} />
          {TRANSLATE_LANGUAGES.map((l) => (
            <Chip key={l.tag} label={l.name} active={mode === l.tag} onPress={() => setMode(l.tag)} />
          ))}
        </View>
        <Text style={[type.caption, { marginTop: space.sm, color: status === 'failed' ? palette.danger : palette.textSecondary }]}>
          {translateAvailable ? STATUS_TEXT[status] : STATUS_TEXT.unavailable}
        </Text>
        <Text style={[type.caption, { marginTop: space.xs }]}>
          Machine translation can be imperfect. Hero names, codes and numbers stay as they are in the game.
        </Text>
        {status === 'ready' ? (
          <Text style={[type.caption, { marginTop: space.xs, color: palette.cyan }]} onPress={() => clearTranslationCache()}>
            Clear saved translations
          </Text>
        ) : null}
      </Card>
    </>
  );
}
