/** Game content that can be replaced by the online data pack without a new APK. */
import { useEffect, useState } from 'react';
import { shops as bundledShops } from '@/data/seed';
import { getMeta } from '@/db/repo';
import { parseManifest } from '@/db/ota-parse';
import type { Shop } from '@/types/game';

let cachedShops: Shop[] | null = null;

/** Shops from the latest data pack, or the ones built into the app. */
export async function loadShops(): Promise<Shop[]> {
  if (cachedShops) return cachedShops;
  try {
    const raw = await getMeta('ota_shops');
    const parsed = raw ? parseManifest({ version: 0, packs: { shops: JSON.parse(raw) } }).packs.shops ?? [] : [];
    cachedShops = parsed.length ? parsed : bundledShops;
  } catch {
    cachedShops = bundledShops;
  }
  return cachedShops;
}

/** Call after a data pack is applied so screens pick up the new content. */
export function clearContentCache() { cachedShops = null; }

export function useShops(): Shop[] {
  const [list, setList] = useState<Shop[]>(cachedShops ?? bundledShops);
  useEffect(() => { let alive = true; loadShops().then((s) => { if (alive) setList(s); }).catch(() => undefined); return () => { alive = false; }; }, []);
  return list;
}
