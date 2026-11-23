/** Pure helpers for loading hero portraits from the Puzzles & Chaos community wiki at runtime. */

export const WIKI_API = 'https://puzzles-chaos.fandom.com/api.php';
const IMAGE_HOST = 'https://static.wikia.nocookie.net/puzzles-chaos/';
export const PORTRAIT_SIZE = 256;
/** The MediaWiki API accepts up to 50 titles per request. */
export const TITLES_PER_REQUEST = 50;

export function portraitQueryUrl(titles: string[]): string {
  const params = [
    'action=query', 'prop=pageimages', `pithumbsize=${PORTRAIT_SIZE}`, 'format=json', 'redirects=1', 'origin=*',
    `titles=${encodeURIComponent(titles.join('|'))}`,
  ];
  return `${WIKI_API}?${params.join('&')}`;
}

interface WikiResponse {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<string, { title?: string; missing?: string; thumbnail?: { source?: string } }>;
  };
}

/**
 * Maps hero ids to portrait URLs from one API response. Only https images on the wiki's own image host
 * are accepted, so a changed or tampered response can't point the app anywhere else.
 */
export function parsePortraitResponse(raw: unknown, batch: { id: string; name: string }[]): Record<string, string> {
  const q = (raw as WikiResponse | null)?.query;
  if (!q?.pages) return {};
  const norm = new Map((q.normalized ?? []).map((n) => [n.from, n.to]));
  const redir = new Map((q.redirects ?? []).map((r) => [r.from, r.to]));
  const byTitle = new Map(Object.values(q.pages).filter((p) => p.title).map((p) => [p.title!, p]));
  const out: Record<string, string> = {};
  for (const { id, name } of batch) {
    const t1 = norm.get(name) ?? name;
    const page = byTitle.get(redir.get(t1) ?? t1);
    const src = page?.thumbnail?.source;
    if (typeof src === 'string' && src.startsWith(IMAGE_HOST)) out[id] = src;
  }
  return out;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
