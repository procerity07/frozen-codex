import Constants from 'expo-constants';
import type { DataManifest } from '@/types/game';
import { parseManifest } from './ota-parse';

export { parseManifest };
import { getDb } from './client';
import { getMeta, setMeta } from './repo';
import { upsertEvents, upsertGiftCodes, upsertHeroes, upsertSophia } from './seed';

export const DEFAULT_MANIFEST_URL: string =
  (Constants.expoConfig?.extra as { dataManifestUrl?: string } | undefined)?.dataManifestUrl ??
  'https://raw.githubusercontent.com/procerity07/frozen-codex/main/data-pack/manifest.json';

export interface SyncResult {
  status: 'updated' | 'up-to-date' | 'error';
  version: number;
  counts: { heroes: number; events: number; giftCodes: number; sophia: number };
  message: string;
}

export async function applyManifest(manifest: DataManifest): Promise<SyncResult['counts']> {
  const db = await getDb();
  const { heroes = [], events = [], giftCodes = [], sophia = [] } = manifest.packs;
  await db.withTransactionAsync(async () => {
    await upsertHeroes(db, heroes, 'ota');
    await upsertEvents(db, events, 'ota');
    await upsertGiftCodes(db, giftCodes, 'ota');
    await upsertSophia(db, sophia, 'ota');
  });
  await setMeta('ota_version', String(manifest.version));
  await setMeta('ota_synced_at', new Date().toISOString());
  return { heroes: heroes.length, events: events.length, giftCodes: giftCodes.length, sophia: sophia.length };
}

export async function checkForUpdates(url: string = DEFAULT_MANIFEST_URL, force = false): Promise<SyncResult> {
  const empty = { heroes: 0, events: 0, giftCodes: 0, sophia: 0 };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    const manifest = parseManifest(await res.json());
    const local = Number((await getMeta('ota_version')) ?? 0);
    if (!force && manifest.version <= local) {
      return { status: 'up-to-date', version: local, counts: empty, message: `Data pack v${local} is current.` };
    }
    const counts = await applyManifest(manifest);
    return { status: 'updated', version: manifest.version, counts, message: `Merged data pack v${manifest.version}.` };
  } catch (e) {
    return { status: 'error', version: 0, counts: empty, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}
