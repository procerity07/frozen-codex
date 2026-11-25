/**
 * Automatic on-device translation. The app is written in English; when the phone uses another
 * language, text is translated on the phone by Google ML Kit (no translation files, no server).
 * Translations are cached per language so each sentence is only translated once.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

interface MlTranslateNative {
  deviceLanguage(): string;
  isSupported(tag: string): boolean;
  ensureModel(tag: string, wifiOnly: boolean): Promise<boolean>;
  translate(texts: string[], tag: string): Promise<string[]>;
}

const native = Platform.OS === 'android' ? requireOptionalNativeModule<MlTranslateNative>('MlTranslate') : null;

/** 'auto' follows the phone, 'off' keeps English, anything else is a language code such as 'de'. */
export type TranslateMode = string;
export type TranslateStatus = 'off' | 'unavailable' | 'downloading' | 'ready' | 'failed';

export const TRANSLATE_LANGUAGES: { tag: string; name: string }[] = [
  { tag: 'de', name: 'Deutsch' }, { tag: 'ru', name: 'Русский' }, { tag: 'fr', name: 'Français' },
  { tag: 'es', name: 'Español' }, { tag: 'pt', name: 'Português' }, { tag: 'it', name: 'Italiano' },
  { tag: 'pl', name: 'Polski' }, { tag: 'tr', name: 'Türkçe' }, { tag: 'uk', name: 'Українська' },
  { tag: 'nl', name: 'Nederlands' }, { tag: 'ar', name: 'العربية' }, { tag: 'zh', name: '中文' },
  { tag: 'ja', name: '日本語' }, { tag: 'ko', name: '한국어' }, { tag: 'id', name: 'Bahasa Indonesia' },
  { tag: 'vi', name: 'Tiếng Việt' }, { tag: 'th', name: 'ไทย' },
];

export const translateAvailable = native != null;

export function deviceLanguage(): string {
  try {
    if (native) return native.deviceLanguage();
    return (Intl.DateTimeFormat().resolvedOptions().locale || 'en').split('-')[0] ?? 'en';
  } catch {
    return 'en';
  }
}

let target: string | null = null; // null = English / off
let status: TranslateStatus = 'off';
let cache = new Map<string, string>();
const protectedTerms = new Set<string>();
const listeners = new Set<() => void>();
const first = new Set<() => void>();
const pending = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;

function emit() {
  first.forEach((l) => l());
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void, early = false): () => void {
  (early ? first : listeners).add(l);
  return () => listeners.delete(l);
}

export function getStatus(): TranslateStatus {
  return status;
}

export function activeLanguage(): string | null {
  return status === 'ready' ? target : null;
}

/** Names (heroes, items, events) that must stay exactly as they are in the game. */
export function protectTerms(names: Iterable<string>) {
  for (const n of names) if (n) protectedTerms.add(n.trim());
}

const cacheKey = (tag: string) => `fc-translate-${tag}`;

/** Applies the user's choice. Safe to call repeatedly. */
export async function configureTranslation(mode: TranslateMode, wifiOnly = false): Promise<void> {
  const tag = mode === 'off' ? null : mode === 'auto' ? deviceLanguage() : mode;
  const want = tag && tag !== 'en' ? tag : null;
  if (want === target && status !== 'failed') return;
  const gen = ++generation;
  target = want;
  cache = new Map();
  pending.clear();
  if (!want) {
    status = 'off';
    emit();
    return;
  }
  if (!native || !native.isSupported(want)) {
    status = 'unavailable';
    emit();
    return;
  }
  status = 'downloading';
  emit();
  try {
    const saved = await AsyncStorage.getItem(cacheKey(want));
    if (saved) cache = new Map(Object.entries(JSON.parse(saved) as Record<string, string>));
    await native.ensureModel(want, wifiOnly);
    if (gen !== generation) return;
    status = 'ready';
  } catch {
    if (gen !== generation) return;
    status = 'failed';
  }
  emit();
}

/** Text that should not go through the translator: numbers, codes, names, symbols. */
export function shouldTranslate(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-z]{2}/.test(t)) return false;
  if (protectedTerms.has(t)) return false;
  if (/^[A-Z0-9_-]{4,}$/.test(t)) return false; // gift codes, IDs
  if (/^https?:\/\//.test(t)) return false;
  return true;
}

/** Returns the translation if it is known; otherwise queues it and returns null. */
export function lookup(text: string): string | null {
  if (status !== 'ready' || !target) return null;
  const hit = cache.get(text);
  if (hit != null) return hit;
  pending.add(text);
  if (!flushTimer) flushTimer = setTimeout(flush, 60);
  return null;
}

async function flush() {
  flushTimer = null;
  if (!native || !target || pending.size === 0) return;
  const tag = target;
  const gen = generation;
  const batch = [...pending].slice(0, 80);
  batch.forEach((b) => pending.delete(b));
  try {
    const out = await native.translate(batch.map(shield), tag);
    if (gen !== generation) return;
    batch.forEach((b, i) => cache.set(b, unshield(out[i] ?? b)));
    scheduleSave(tag);
    emit();
  } catch {
    /* keep English for these */
  }
  if (pending.size) flushTimer = setTimeout(flush, 30);
}

// Names inside sentences are swapped for placeholders the translator leaves alone.
let shieldMap: string[] = [];
function shield(text: string): string {
  let s = text;
  for (const term of protectedTerms) {
    if (term.length < 3 || !s.includes(term)) continue;
    let i = shieldMap.indexOf(term);
    if (i < 0) i = shieldMap.push(term) - 1;
    s = s.split(term).join(`⟦${i}⟧`);
  }
  return s;
}
function unshield(text: string): string {
  return text.replace(/⟦\s*(\d+)\s*⟧/g, (m, n) => shieldMap[Number(n)] ?? m);
}

function scheduleSave(tag: string) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (tag !== target) return;
    AsyncStorage.setItem(cacheKey(tag), JSON.stringify(Object.fromEntries(cache))).catch(() => {});
  }, 2000);
}

export async function clearTranslationCache(): Promise<void> {
  const keys = TRANSLATE_LANGUAGES.map((l) => cacheKey(l.tag));
  await AsyncStorage.multiRemove(keys).catch(() => {});
  cache = new Map();
  emit();
}
