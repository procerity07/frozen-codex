import Constants from 'expo-constants';
import { isNewer, parseRelease, type ReleaseInfo } from '@/lib/appUpdate';

const extra = (Constants.expoConfig?.extra ?? {}) as { releaseRepo?: string };
export const RELEASE_REPO = extra.releaseRepo ?? 'procerity07/frozen-codex';

/** Version baked into this APK by the build workflow (falls back to app.json's version). */
export const CURRENT_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

export type UpdateCheck =
  | { status: 'update'; release: ReleaseInfo }
  | { status: 'current'; release: ReleaseInfo | null }
  | { status: 'error'; message: string };

let cached: { at: number; result: UpdateCheck } | null = null;
const CACHE_MS = 30 * 60 * 1000;

/** Asks GitHub for the latest release. Results are cached for 30 minutes unless forced. */
export async function checkForAppUpdate(force = false): Promise<UpdateCheck> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.result;
  let result: UpdateCheck;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.github.com/repos/${RELEASE_REPO}/releases/latest`, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
    const release = parseRelease(await res.json(), RELEASE_REPO);
    if (!release) throw new Error('The latest release has no APK attached');
    result = isNewer(release.version, CURRENT_VERSION) ? { status: 'update', release } : { status: 'current', release };
  } catch (e) {
    result = { status: 'error', message: e instanceof Error ? e.message : 'Could not reach GitHub' };
  }
  cached = { at: Date.now(), result };
  return result;
}
