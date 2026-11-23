import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { heroes } from '@/data/seed';
import { chunk, parsePortraitResponse, portraitQueryUrl, TITLES_PER_REQUEST } from '@/lib/portraits';

const CACHE_KEY = 'frozen-codex-portraits-v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PortraitState {
  urls: Record<string, string>;
  /** Hero ids whose image failed to load this session (fall back to the badge). */
  failed: Record<string, true>;
  markFailed: (id: string) => void;
}

export const usePortraits = create<PortraitState>()((set, get) => ({
  urls: {},
  failed: {},
  markFailed: (id) => set({ failed: { ...get().failed, [id]: true } }),
}));

let loading: Promise<void> | null = null;

async function fetchAll(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const batch of chunk(heroes.map((h) => ({ id: h.id, name: h.name })), TITLES_PER_REQUEST)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(portraitQueryUrl(batch.map((b) => b.name)), { signal: controller.signal });
      if (res.ok) Object.assign(out, parsePortraitResponse(await res.json(), batch));
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
}

/** Loads portrait links: cached ones immediately, refreshed from the wiki when older than 7 days. Never throws. */
export function loadPortraits(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    let cached: { at: number; urls: Record<string, string> } | null = null;
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      cached = raw ? (JSON.parse(raw) as { at: number; urls: Record<string, string> }) : null;
      if (cached?.urls) usePortraits.setState({ urls: cached.urls });
    } catch { /* ignore a corrupt cache */ }
    if (cached && Date.now() - cached.at < MAX_AGE_MS && Object.keys(cached.urls).length) return;
    try {
      const urls = await fetchAll();
      if (Object.keys(urls).length) {
        usePortraits.setState({ urls });
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), urls }));
      }
    } catch { /* offline: keep cached links or badges */ }
  })().finally(() => { loading = null; });
  return loading;
}
