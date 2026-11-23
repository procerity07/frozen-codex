import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Download, Sparkles } from 'lucide-react-native';
import type { ReleaseInfo } from '@/lib/appUpdate';
import { notesToBlocks } from '@/lib/appUpdate';
import { checkForAppUpdate, CURRENT_VERSION } from '@/services/appUpdate';
import { useAppStore } from '@/store/useAppStore';
import { palette, space, type } from '@/theme';
import { BottomSheet, Button, Card, Row } from '@/components/ui';

/** Release notes rendered natively from the auto-generated Markdown. */
export function ReleaseNotes({ notes }: { notes: string }) {
  const blocks = notesToBlocks(notes);
  if (!blocks.length) return <Text style={type.bodySecondary}>No notes for this release.</Text>;
  return (
    <View style={{ gap: 4 }}>
      {blocks.map((b, i) =>
        b.kind === 'heading' ? (
          <Text key={i} style={[type.heading, { marginTop: i ? space.md : 0, color: palette.cyan }]}>{b.text}</Text>
        ) : b.kind === 'bullet' ? (
          <Row key={i} style={{ alignItems: 'flex-start' }}>
            <Text style={type.body}>{'•'}</Text>
            <Text style={[type.body, { flex: 1 }]}>{b.text}</Text>
          </Row>
        ) : (
          <Text key={i} style={type.bodySecondary}>{b.text}</Text>
        ),
      )}
    </View>
  );
}

export function openDownload(release: ReleaseInfo) {
  Linking.openURL(release.apkUrl).catch(() => { Linking.openURL(release.pageUrl).catch(() => undefined); });
}

/** Shows when GitHub has a newer release than this APK, until downloaded or dismissed for that version. */
export function UpdateBanner() {
  const dismissed = useAppStore((s) => s.dismissedUpdate);
  const dismissUpdate = useAppStore((s) => s.dismissUpdate);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    checkForAppUpdate().then((r) => { if (alive && r.status === 'update') setRelease(r.release); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (!release || release.version === dismissed) return null;

  return (
    <>
      <Card style={{ marginTop: space.xs, marginBottom: space.sm, borderColor: palette.goldLine }} accent={palette.gold}>
        <Row>
          <Sparkles size={18} color={palette.gold} />
          <View style={{ flex: 1 }}>
            <Text style={type.heading}>Update available: v{release.version}</Text>
            <Text style={type.caption}>You have v{CURRENT_VERSION}. Your saved data stays when you update.</Text>
          </View>
        </Row>
        <Row style={{ marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button compact icon={Download} label="Download" variant="gold" onPress={() => openDownload(release)} /></View>
          <View style={{ flex: 1 }}><Button compact label="What's new" variant="secondary" onPress={() => setNotesOpen(true)} /></View>
          <Button compact label="Later" variant="ghost" onPress={() => dismissUpdate(release.version)} />
        </Row>
      </Card>
      <BottomSheet visible={notesOpen} onClose={() => setNotesOpen(false)} title={`What's new in v${release.version}`} subtitle={release.publishedAt ? `Released ${release.publishedAt.slice(0, 10)}` : undefined}>
        <ReleaseNotes notes={release.notes} />
        <View style={{ marginTop: space.lg }}>
          <Button icon={Download} label={`Download v${release.version}`} variant="gold" onPress={() => openDownload(release)} />
        </View>
      </BottomSheet>
    </>
  );
}
