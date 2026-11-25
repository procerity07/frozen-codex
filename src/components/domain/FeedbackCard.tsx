import { useState } from 'react';
import { Alert, Linking, Platform, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Bug, Copy, Lightbulb, MessageSquare } from 'lucide-react-native';
import { palette, space, type } from '@/theme';
import { Button, Card, Field, Row, SectionHeader, Segmented } from '@/components/ui';
import { CURRENT_VERSION, RELEASE_REPO } from '@/services/appUpdate';

type Kind = 'Suggestion' | 'Problem' | 'Wrong data';

/** Lets players send ideas, bug reports or data corrections as a GitHub issue (or copy the text to share elsewhere). */
export function FeedbackCard() {
  const [kind, setKind] = useState<Kind>('Suggestion');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  const body = () => [
    details.trim(),
    '',
    '---',
    `Type: ${kind}`,
    `App version: v${CURRENT_VERSION}`,
    `Device: ${Platform.OS} ${String(Platform.Version)}`,
  ].join('\n');
  const heading = () => `[${kind}] ${title.trim() || details.trim().slice(0, 60) || 'Feedback'}`;

  const send = () => {
    if (!details.trim()) { Alert.alert('Add some details', 'Describe your idea or the problem first.'); return; }
    const label = kind === 'Suggestion' ? 'enhancement' : kind === 'Problem' ? 'bug' : 'data';
    const url = `https://github.com/${RELEASE_REPO}/issues/new?title=${encodeURIComponent(heading())}&labels=${label}&body=${encodeURIComponent(body())}`;
    Linking.openURL(url).catch(() => Alert.alert('Could not open the browser', 'Copy the text instead and share it with the app maker.'));
  };
  const copy = () => {
    Clipboard.setStringAsync(`${heading()}\n\n${body()}`).then(() => Alert.alert('Copied', 'Paste it in a message to the app maker (e.g. alliance chat or Discord).')).catch(() => undefined);
  };

  return (
    <>
      <SectionHeader title="Suggestions & problems" icon={MessageSquare} subtitle="Help improve Frozen Codex" />
      <Card>
        <Segmented options={['Suggestion', 'Problem', 'Wrong data'] as const} value={kind} onChange={setKind} />
        <Text style={[type.caption, { marginTop: space.sm }]}>
          {kind === 'Suggestion' ? 'An idea or something you would like added.' : kind === 'Problem' ? 'Something that does not work or crashes. Say what you did and what happened.' : 'A hero, event or shop value that does not match the game. Screenshots help a lot.'}
        </Text>
        <View style={{ marginTop: space.sm }}><Field label="Short title (optional)" value={title} onChangeText={setTitle} placeholder={kind === 'Problem' ? 'e.g. Reminder did not ring' : kind === 'Wrong data' ? 'e.g. Kaira ATK value' : 'e.g. Add a lineup builder'} /></View>
        <View style={{ marginTop: space.sm }}><Field label="Details" value={details} onChangeText={setDetails} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} placeholder="Describe it here" /></View>
        <Row style={{ marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button icon={kind === 'Problem' ? Bug : Lightbulb} label="Send" onPress={send} /></View>
          <View style={{ flex: 1 }}><Button icon={Copy} variant="secondary" label="Copy text" onPress={copy} /></View>
        </Row>
        <Text style={[type.caption, { marginTop: space.sm, color: palette.textMuted }]}>Send opens a GitHub page with your message filled in (free GitHub account needed, screenshots can be attached there). Your app version and Android version are added automatically; nothing else about you is sent.</Text>
      </Card>
    </>
  );
}
