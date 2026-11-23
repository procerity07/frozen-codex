/** Pure helpers for the in-app "update available" check (no React Native imports, so they are testable in Node). */

export interface ReleaseInfo {
  version: string;
  name: string;
  pageUrl: string;
  apkUrl: string;
  notes: string;
  publishedAt: string;
}

export type NoteBlock = { kind: 'heading' | 'bullet' | 'text'; text: string };

/** "v1.0.12" / "V1.0.3" / "1.0.4" -> [1, 0, 12]; null when not a plain x.y.z version. */
export function parseVersion(v: string): [number, number, number] | null {
  const m = /^[vV]?(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Negative when a < b, 0 when equal, positive when a > b. Unparseable versions sort lowest. */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return pa ? 1 : pb ? -1 : 0;
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i]! - pb[i]!;
  return 0;
}

export function isNewer(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

/**
 * Validates a GitHub "latest release" API response. Only links inside the expected repository
 * are accepted, so the app never opens an unexpected download URL.
 */
export function parseRelease(raw: unknown, repo: string): ReleaseInfo | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.tag_name !== 'string' || !parseVersion(r.tag_name)) return null;
  if (r.draft === true || r.prerelease === true) return null;
  const base = `https://github.com/${repo}/`;
  const assets = Array.isArray(r.assets) ? r.assets : [];
  const apk = assets
    .map((a) => (typeof a === 'object' && a ? (a as Record<string, unknown>).browser_download_url : undefined))
    .find((u): u is string => typeof u === 'string' && u.startsWith(base) && u.toLowerCase().endsWith('.apk'));
  const pageUrl = typeof r.html_url === 'string' && r.html_url.startsWith(base) ? r.html_url : `${base}releases/latest`;
  if (!apk) return null;
  const v = parseVersion(r.tag_name)!;
  return {
    version: v.join('.'),
    name: typeof r.name === 'string' && r.name ? r.name : `v${v.join('.')}`,
    pageUrl,
    apkUrl: apk,
    notes: typeof r.body === 'string' ? r.body.slice(0, 20000) : '',
    publishedAt: typeof r.published_at === 'string' ? r.published_at : '',
  };
}

/** Turns the auto-generated release notes into simple blocks for native rendering. */
export function notesToBlocks(md: string): NoteBlock[] {
  const blocks: NoteBlock[] = [];
  for (const rawLine of md.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const t = line.trim();
    if (!t || t === '---' || /^## /.test(t) || /^Install:/i.test(t) || /^Built from commit/i.test(t) || /^Changes (since|in)/i.test(t)) continue;
    if (/^#{3,}\s+/.test(t)) blocks.push({ kind: 'heading', text: t.replace(/^#{3,}\s+/, '') });
    else if (/^[-*]\s+/.test(t)) blocks.push({ kind: 'bullet', text: t.replace(/^[-*]\s+/, '') });
    else if (/^\s{2,}/.test(line) && blocks.length && blocks[blocks.length - 1]!.kind === 'bullet') {
      blocks[blocks.length - 1]!.text += ` ${t}`; // wrapped continuation of a bullet
    } else blocks.push({ kind: 'text', text: t });
  }
  return blocks;
}
