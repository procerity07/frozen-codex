/** Small text helpers (pure, testable in Node). */

/** First sentence of a text (or the first ~110 characters). */
export function firstSentence(text: string, max = 110): string {
  // A sentence ends at . ! ? followed by a space, but not after abbreviations like "Lv." or "e.g.".
  const m = /^(.+?(?<!\b(?:Lv|e\.g|i\.e|vs|No))[.!?])(\s|$)/.exec(text.trim());
  const s = m ? m[1]! : text.trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s;
}


/** Removes source remarks ("(in-game)", "(wiki)", "Values as shown in-game at +4.") from display text; sources live in Data check. */
export function cleanSourceNotes(text: string): string {
  return text
    .replace(/\s*\((?:wiki|in-game|player-confirmed)[^)]*\)/gi, '')
    .replace(/\s*Values (?:as )?shown in-game[^.]*\./gi, '')
    .replace(/^(?:In-game|Wiki)[.,]\s*/i, '')
    .replace(/\s*\(?(?:checked|confirmed) in-game[^.)]*\)?\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Drops the first sentence when it only lists the per-level numbers (shown in the grid instead). */
export function withoutTierSentence(text: string): string {
  const first = firstSentence(text, 10_000);
  return /★|at Hero0|at \+\d/.test(first) && /\d%/.test(first) ? text.trim().slice(first.length).trim() : text;
}
