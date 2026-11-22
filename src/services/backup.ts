import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { defaultState, type PersistedState } from '@/store/useAppStore';

export interface BackupFile { app: 'frozen-codex'; schema: 1; exportedAt: string; profile: PersistedState }

export async function exportProfile(profile: PersistedState): Promise<string> {
  const payload: BackupFile = { app: 'frozen-codex', schema: 1, exportedAt: new Date().toISOString(), profile };
  const file = new File(Paths.cache, `frozen-codex-backup-${new Date().toISOString().slice(0, 10)}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Frozen Codex backup' });
  }
  return file.uri;
}

/** Only keys known to the current profile schema are restored. */
export function sanitizeProfile(raw: unknown): Partial<PersistedState> {
  if (typeof raw !== 'object' || raw === null) throw new Error('Backup is not a JSON object');
  const obj = raw as Record<string, unknown>;
  const src = (obj.app === 'frozen-codex' && typeof obj.profile === 'object' && obj.profile ? obj.profile : obj) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(defaultState) as (keyof PersistedState)[]) {
    if (k in src && typeof src[k] === typeof defaultState[k]) out[k] = src[k];
  }
  return out as Partial<PersistedState>;
}

export async function importProfile(): Promise<Partial<PersistedState> | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  const text = await new File(res.assets[0].uri).text();
  return sanitizeProfile(JSON.parse(text));
}
