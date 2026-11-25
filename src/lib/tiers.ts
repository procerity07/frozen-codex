/**
 * Reads skill value text such as "5★ +2 to +8: 40/60/90%; 6★ +5 to +8: 150/220%" or
 * "4★: +20% at +2, +30% at +3" into a grid: stars → values at Hero0 … +8 (null = none).
 * Text with no star mark applies to every star ("*").
 */
export type TierGrid = Record<string, (number | null)[]>;

const LEVELS = 9;
const lvl = (s: string) => (s === 'Hero0' ? 0 : Number(s.replace('+', '')));
const num = (s: string) => Number(s.replace(/,/g, ''));

function parseSegment(seg: string, row: (number | null)[]) {
  let found = false;
  // "+2 to +8: a/b/c%"  or  "a/b/c% from +2 to +8"
  const pre = /(Hero0|\+\d)\s+to\s+\+(\d)\s*:\s*([\d.,]+(?:\/[\d.,]+)+)%/g;
  const post = /([\d.,]+(?:\/[\d.,]+)+)%\s*from\s+(Hero0|\+\d)\s+to\s+\+(\d)/g;
  const fill = (from: number, to: number, list: string) => {
    const vals = list.split('/').map(num);
    if (vals.length !== to - from + 1) return;
    vals.forEach((v, i) => { row[from + i] = v; });
    found = true;
  };
  for (const m of seg.matchAll(pre)) fill(lvl(m[1]!), Number(m[2]), m[3]!);
  for (const m of seg.matchAll(post)) fill(lvl(m[2]!), Number(m[3]), m[1]!);
  // "+30% at +1", "100% at Hero0"
  for (const m of seg.matchAll(/\+?([\d.,]+)%\s*at\s+(Hero0|\+\d)/g)) { row[lvl(m[2]!)] = num(m[1]!); found = true; }
  return found;
}

export function parseTierText(text: string): TierGrid | null {
  const grid: TierGrid = {};
  const segs = text.split(';');
  for (const seg of segs) {
    const star = /(\d)★/.exec(seg)?.[1] ?? '*';
    const row = grid[star] ?? Array<number | null>(LEVELS).fill(null);
    if (parseSegment(seg, row)) grid[star] = row;
  }
  // A value below +5 listed on a 6★/7★ row (e.g. "(+30% at +1)") belongs to the star below.
  const stars = Object.keys(grid).filter((k) => k !== '*').sort();
  for (let i = 1; i < stars.length; i++) {
    const row = grid[stars[i]!]!, lower = grid[stars[i - 1]!]!;
    for (let l = 0; l < 5; l++) if (row[l] != null && lower[l] == null) { lower[l] = row[l]!; row[l] = null; }
  }
  // "Maximum 500%: it does not increase at +6 to +8" keeps the last value.
  if (/does not increase/i.test(text)) for (const row of Object.values(grid)) for (let l = 1; l < LEVELS; l++) if (row[l] == null && row[l - 1] != null) row[l] = row[l - 1]!;
  return Object.keys(grid).length ? grid : null;
}

/** Value for the hero's current stars and enhancement, if the grid has it. */
export function currentTier(grid: TierGrid, stars: number, enhancement: number): number | null {
  const row = grid[String(stars)] ?? grid['*'];
  return row?.[enhancement] ?? null;
}

/** Turns civil-skill `tiers` ({ '5': [...] }) into a grid of 9 levels. */
export function gridFromTiers(tiers: Partial<Record<string, (number | null)[]>>): TierGrid {
  const g: TierGrid = {};
  for (const [k, v] of Object.entries(tiers)) if (v) g[k] = Array.from({ length: LEVELS }, (_, i) => v[i] ?? null);
  return g;
}
