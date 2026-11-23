import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { getDb } from '@/db/client';

/** Native module from modules/sophia-bubble (Android only). Absent on other platforms and older builds. */
interface SophiaBubbleNative {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  isRunning(): boolean;
  start(questionsJson: string): void;
  stop(): void;
}

const native = Platform.OS === 'android' ? requireOptionalNativeModule<SophiaBubbleNative>('SophiaBubble') : null;

/** True only on Android builds that include the bubble. Everything else in the app works without it. */
export const bubbleSupported = !!native;

export function bubbleRunning(): boolean {
  try { return !!native?.isRunning(); } catch { return false; }
}

export function canShowBubble(): boolean {
  try { return !!native?.canDrawOverlays(); } catch { return false; }
}

export function openBubblePermission(): void {
  native?.openOverlaySettings();
}

/** Copies the current Sophia's Test answers (bundled + any data-pack additions) into the bubble and starts it. */
export async function startBubble(): Promise<number> {
  if (!native) throw new Error('The floating bubble is not available on this device');
  const db = await getDb();
  const rows = await db.getAllAsync<{ question: string; answer: string; keywords: string }>('SELECT question, answer, keywords FROM sophia');
  native.start(JSON.stringify(rows.map((r) => ({ q: r.question, a: r.answer, k: r.keywords }))));
  return rows.length;
}

export function stopBubble(): void {
  native?.stop();
}
