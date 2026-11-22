/** Lightweight fuzzy scoring used as a fallback when FTS returns nothing (typos, partial words). */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length]!;
}

/** Returns 0..1 — how well every query token matches some word in the haystack. */
export function fuzzyScore(query: string, haystack: string): number {
  const q = normalize(query).split(' ').filter(Boolean);
  if (!q.length) return 0;
  const words = normalize(haystack).split(' ');
  let total = 0;
  for (const t of q) {
    let best = 0;
    for (const w of words) {
      if (w.startsWith(t)) { best = 1; break; }
      if (w.includes(t)) { best = Math.max(best, 0.85); continue; }
      if (t.length >= 4) {
        const d = levenshtein(t, w.slice(0, t.length + 1));
        const s = 1 - d / Math.max(t.length, 1);
        if (s > best) best = s;
      }
    }
    total += best;
  }
  return total / q.length;
}

/** Builds a safe FTS5 MATCH expression: every token as a prefix term, AND-ed. */
export function ftsQuery(input: string): string | null {
  const tokens = normalize(input).split(' ').filter((t) => t.length > 0);
  if (!tokens.length) return null;
  return tokens.map((t) => `"${t}"*`).join(' AND ');
}
