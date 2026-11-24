import Constants from 'expo-constants';
import type { DataManifest } from '@/types/game';
import { parseManifest } from './ota-parse';

export { parseManifest };
import { getDb } from './client';
import { sophiaQuestions } from '@/data/seed';
import { getMeta, setMeta } from './repo';
import { mergePackEvents, mergePackHeroes, upsertGiftCodes, upsertSophia } from './seed';

export const DEFAULT_MANIFEST_URL: string =
  (Constants.expoConfig?.extra as { dataManifestUrl?: string } | undefined)?.dataManifestUrl ??
  'https://raw.githubusercontent.com/procerity07/frozen-codex/main/data-pack/manifest.json';

export interface SyncResult {
  status: 'updated' | 'up-to-date' | 'error';
  version: number;
  counts: { heroes: number; events: number; giftCodes: number; sophia: number };
  message: string;
  /** Hero and event ids the pack contained but did not apply because stored data is a newer revision. */
  skippedHeroes?: string[];
}

export async function applyManifest(manifest: DataManifest): Promise<SyncResult['counts'] & { skippedHeroes: string[] }> {
  const db = await getDb();
  const { heroes = [], events = [], giftCodes = [], sophia = [] } = manifest.packs;
  let heroResult = { applied: 0, skipped: [] as string[] };
  let eventResult = { applied: 0, skipped: [] as string[] };
  await db.withTransactionAsync(async () => {
    heroResult = await mergePackHeroes(db, heroes);
    eventResult = await mergePackEvents(db, events);
    await upsertGiftCodes(db, giftCodes, 'ota');
    // Online questions can add to the bundled list but never replace a bundled (real in-game) question.
    const bundledIds = new Set(sophiaQuestions.map((q) => q.id));
    await upsertSophia(db, sophia.filter((q) => !bundledIds.has(q.id)), 'ota');
  });
  if (manifest.packs.shops?.length) await setMeta('ota_shops', JSON.stringify(manifest.packs.shops));
  await setMeta('ota_version', String(manifest.version));
  await setMeta('ota_synced_at', new Date().toISOString());
  return { heroes: heroResult.applied, events: eventResult.applied, giftCodes: giftCodes.length, sophia: sophia.length, skippedHeroes: [...heroResult.skipped, ...eventResult.skipped] };
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
    const { skippedHeroes, ...counts } = await applyManifest(manifest);
    const skippedNote = skippedHeroes.length ? ` Kept newer local data for ${skippedHeroes.length} hero/event record${skippedHeroes.length === 1 ? '' : 's'}.` : '';
    return { status: 'updated', version: manifest.version, counts, skippedHeroes, message: `Merged data pack v${manifest.version}.${skippedNote}` };
  } catch (e) {
    return { status: 'error', version: 0, counts: empty, message: e instanceof Error ? e.message : 'Unknown error' };
  }
}

const AUTO_SYNC_EVERY_MS = 3 * 60 * 60 * 1000;

/**
 * Quietly checks the online data pack when the app opens (at most every 3 hours), so data fixes
 * arrive without installing a new APK. Never throws.
 */
export async function autoSync(url: string = DEFAULT_MANIFEST_URL): Promise<SyncResult | null> {
  try {
    const last = Date.parse((await getMeta('ota_checked_at')) ?? '');
    if (Number.isFinite(last) && Date.now() - last < AUTO_SYNC_EVERY_MS) return null;
    const r = await checkForUpdates(url, false);
    if (r.status !== 'error') await setMeta('ota_checked_at', new Date().toISOString());
    return r;
  } catch {
    return null;
  }
}
