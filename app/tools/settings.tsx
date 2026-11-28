import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Constants from 'expo-constants';
import { Bell, Database, Download, Languages, RefreshCw, Smartphone, Sparkles, Upload, User } from 'lucide-react-native';
import { palette, space, type } from '@/theme';
import { TranslateCard } from '@/components/domain/TranslateCard';
import { Badge, Button, Card, Chip, ChipRow, CollapsibleSection, Field, NumberField, Row, Screen, SectionHeader, Stat } from '@/components/ui';
import { selectPersisted, useAppStore } from '@/store/useAppStore';
import { dbStats, getMeta } from '@/db/repo';
import { checkForUpdates, DEFAULT_MANIFEST_URL, type SyncResult } from '@/db/ota';
import { clearContentCache } from '@/services/content';
import { exportProfile, exportRoster, importProfile, importRoster } from '@/services/backup';
import { ensurePermission, scheduleDailyReset } from '@/services/notifications';
import { SEED_VERSION } from '@/data/seed';
import { checkForAppUpdate, CURRENT_VERSION, type UpdateCheck } from '@/services/appUpdate';
import { openDownload } from '@/components/domain/UpdateBanner';
import { hasWhatsNew, WhatsNewSheet } from '@/components/domain/Dashboard';
import { FeedbackCard } from '@/components/domain/FeedbackCard';

const LEADS = [5, 10, 15, 30, 60];

export default function SettingsScreen() {
  const s = useAppStore();
  const [stats, setStats] = useState<{ heroes: number; events: number; sophia: number; codes: number } | null>(null);
  const [otaVersion, setOtaVersion] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [resetAlarm, setResetAlarm] = useState(!!s.alarms['daily-reset']);
  const [appCheck, setAppCheck] = useState<UpdateCheck | null>(null);
  const [appBusy, setAppBusy] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const loadStats = () => {
    dbStats().then(setStats).catch(() => undefined);
    getMeta('ota_version').then(setOtaVersion).catch(() => undefined);
    getMeta('ota_synced_at').then(setSyncedAt).catch(() => undefined);
  };
  useEffect(loadStats, []);

  const sync = async (force: boolean) => {
    setBusy(true);
    const r = await checkForUpdates(s.manifestUrl.trim() || DEFAULT_MANIFEST_URL, force);
    if (r.status === 'updated') clearContentCache();
    setResult(r);
    setBusy(false);
    loadStats();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Settings' }} />
      <CollapsibleSection title="Account" icon={User} subtitle="Realm, lord name, first-time setup" initiallyOpen={false}>
            <Card>
        <Row>
          <Field label="Realm #" value={s.realm.number} onChangeText={(v) => s.setRealm({ number: v })} keyboardType="numeric" placeholder="412" />
          <NumberField label="Realm age (weeks)" value={s.realm.ageWeeks} onChange={(n) => s.setRealm({ ageWeeks: n })} />
        </Row>
        <Row style={{ marginTop: space.sm }}>
          <Field label="Server" value={s.realm.server} onChangeText={(v) => s.setRealm({ server: v })} />
          <Field label="Lord name" value={s.realm.lordName} onChangeText={(v) => s.setRealm({ lordName: v })} autoCapitalize="none" />
        </Row>
        <Text style={[type.caption, { marginTop: space.sm }]}>Realm age decides which Radiant / Ace Hero Choice Card the Event Points Calculator shows.</Text>
      </Card>
      <View style={{ marginTop: space.sm }}>
        <Button icon={Sparkles} variant="secondary" label="Run first-time setup again" onPress={() => { s.setOnboarded(false); router.replace('/onboarding'); }} />
      </View>
      </CollapsibleSection>

      <CollapsibleSection title="Alerts" icon={Bell} subtitle="Alarm lead time and exact alarms" initiallyOpen={false}>
            <Text style={type.caption}>Lead time before event start</Text>
      <ChipRow>{LEADS.map((m) => <Chip key={m} label={`${m} min`} active={s.alarmLeadMinutes === m} onPress={() => s.setAlarmLead(m)} />)}</ChipRow>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Daily reset reminder</Text>
            <Text style={type.caption}>{s.alarmLeadMinutes} min before 00:00 UTC</Text>
          </View>
          <Switch
            value={resetAlarm}
            trackColor={{ true: palette.cyan, false: palette.border }}
            thumbColor={palette.text}
            onValueChange={async (on) => {
              if (on && !(await ensurePermission())) return;
              await scheduleDailyReset(on, s.alarmLeadMinutes);
              s.setAlarm('daily-reset', on);
              setResetAlarm(on);
            }}
          />
        </Row>
        <Text style={[type.caption, { marginTop: space.sm }]}>Event alarms already set keep their old lead time until toggled again.</Text>
      </Card>
      </CollapsibleSection>

      <CollapsibleSection title="Language & display" icon={Languages} subtitle="Translation, hero portraits, app tour" initiallyOpen={false}>
      <TranslateCard />
            <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Show hero portraits</Text>
            <Text style={type.caption}>Loaded from the Puzzles & Chaos community wiki and kept on your phone. Off = letter badges, no image downloads.</Text>
          </View>
          <Switch value={s.showPortraits} onValueChange={s.setShowPortraits} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
        </Row>
      </Card>
      <Card>
        <Text style={type.body}>App tour</Text>
        <Text style={type.caption}>A quick look at what each tab does.</Text>
        <View style={{ marginTop: space.sm }}><Button compact variant="secondary" label="Show the tour again" onPress={() => { s.setTourDone(false); router.navigate('/'); }} /></View>
      </Card>
      </CollapsibleSection>

      <CollapsibleSection title="Data & backup" icon={Database} subtitle="App and database updates, backup, feedback" initiallyOpen={false}>
      <SectionHeader title="App updates" icon={Smartphone} />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Installed version" value={`v${CURRENT_VERSION}`} />
          {appCheck?.status === 'update' ? <Badge label={`v${appCheck.release.version} available`} color={palette.gold} /> : null}
          {appCheck?.status === 'current' ? <Badge label="Up to date" color={palette.success} /> : null}
        </Row>
        <View style={{ marginTop: space.md }}>
          {appCheck?.status === 'update' ? (
            <Button icon={Download} variant="gold" label={`Download v${appCheck.release.version}`} onPress={() => openDownload(appCheck.release)} />
          ) : (
            <Button icon={RefreshCw} variant="secondary" label="Check for app updates" disabled={appBusy} onPress={() => {
              setAppBusy(true);
              checkForAppUpdate(true).then(setAppCheck).finally(() => setAppBusy(false));
            }} />
          )}
        </View>
        {appCheck?.status === 'error' ? <Text style={[type.caption, { marginTop: space.sm, color: palette.danger }]}>{appCheck.message}</Text> : null}
        {hasWhatsNew() ? <View style={{ marginTop: space.sm }}><Button icon={Sparkles} variant="ghost" label={`What's new in v${CURRENT_VERSION}`} onPress={() => setNotesOpen(true)} /></View> : null}
      </Card>
      <WhatsNewSheet open={notesOpen} onClose={() => setNotesOpen(false)} />

      <SectionHeader title="Database updates" icon={Database} subtitle="Tap to get the latest heroes, events, Sophia answers, codes and shops without a new APK" />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Stat label="Bundled seed" value={`v${SEED_VERSION}`} />
          <Stat label="Data pack" value={otaVersion ? `v${otaVersion}` : 'none'} align="right" color={otaVersion ? palette.cyan : palette.textMuted} />
        </Row>
        {stats ? (
          <Text style={[type.numberSmall, { marginTop: space.sm }]}>{stats.heroes} heroes · {stats.events} events · {stats.sophia} answers · {stats.codes} codes</Text>
        ) : null}
        {syncedAt ? <Text style={[type.caption, { marginTop: 2 }]}>Last sync {syncedAt.slice(0, 16).replace('T', ' ')} UTC</Text> : null}
        <View style={{ marginTop: space.md }}>
          <Field label="Manifest URL" value={s.manifestUrl} onChangeText={s.setManifestUrl} placeholder={DEFAULT_MANIFEST_URL} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        </View>
        <Row style={{ marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button icon={RefreshCw} label="Check for updates" disabled={busy} onPress={() => { sync(false).catch(() => undefined); }} /></View>
          <Button variant="secondary" label="Force" disabled={busy} onPress={() => { sync(true).catch(() => undefined); }} />
        </Row>
        {busy ? <ActivityIndicator color={palette.cyan} style={{ marginTop: space.md }} /> : null}
        {result ? (
          <View style={{ marginTop: space.md, gap: 4 }}>
            <Badge label={result.status === 'updated' ? 'Updated' : result.status === 'up-to-date' ? 'Up to date' : 'Failed'} color={result.status === 'error' ? palette.danger : palette.success} />
            <Text style={type.bodySecondary}>{result.message}</Text>
            {result.status === 'updated' ? <Text style={type.numberSmall}>+{result.counts.heroes} heroes · +{result.counts.events} events · +{result.counts.giftCodes} codes · +{result.counts.sophia} answers</Text> : null}
          </View>
        ) : null}
      </Card>


      <SectionHeader title="Backup" subtitle="Profile, castles, checklists, calculators" />
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Button icon={Upload} variant="secondary" label="Export JSON" onPress={() => { exportProfile(selectPersisted(useAppStore.getState())).catch((e: unknown) => Alert.alert('Export failed', String(e))); }} /></View>
          <View style={{ flex: 1 }}><Button icon={Download} variant="secondary" label="Import JSON" onPress={() => {
            importProfile().then((data) => {
              if (!data) return;
              Alert.alert('Replace local data?', 'Your current profile will be overwritten.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Import', style: 'destructive', onPress: () => s.importState(data) },
              ]);
            }).catch((e: unknown) => Alert.alert('Import failed', e instanceof Error ? e.message : String(e)));
          }} /></View>
        </Row>
      </Card>
      <Card>
        <Text style={type.body}>Hero roster</Text>
        <Text style={type.caption}>{Object.keys(s.roster).length} heroes saved. Importing adds or updates heroes and keeps everything else.</Text>
        <Row style={{ marginTop: space.md }}>
          <View style={{ flex: 1 }}><Button icon={Upload} variant="secondary" label="Export roster" onPress={() => { exportRoster(s.roster).catch((e: unknown) => Alert.alert('Export failed', String(e))); }} /></View>
          <View style={{ flex: 1 }}><Button icon={Download} variant="secondary" label="Import roster" onPress={() => {
            importRoster().then((r) => {
              if (!r) return;
              const n = Object.keys(r.entries).length;
              Alert.alert('Import roster?', `${n} hero${n === 1 ? '' : 'es'} will be added or updated.${r.skipped.length ? ` ${r.skipped.length} unknown entr${r.skipped.length === 1 ? 'y' : 'ies'} skipped.` : ''}`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Import', onPress: () => s.mergeRoster(r.entries) },
              ]);
            }).catch((e: unknown) => Alert.alert('Import failed', e instanceof Error ? e.message : String(e)));
          }} /></View>
        </Row>
      </Card>


      <FeedbackCard />
      </CollapsibleSection>

      <Text style={[type.caption, { textAlign: 'center', marginTop: space.xl }]}>
        Frozen Codex {Constants.expoConfig?.version ?? ''} · Unofficial fan companion, not affiliated with 37GAMES.
      </Text>
    </Screen>
  );
}
