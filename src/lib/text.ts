/** Small text helpers (pure, testable in Node). */

/** First sentence of a text (or the first ~110 characters). */
export function firstSentence(text: string, max = 110): string {
  // A sentence ends at . ! ? followed by a space, but not after abbreviations like "Lv." or "e.g.".
  const m = /^(.+?(?<!\b(?:Lv|e\.g|i\.e|vs|No))[.!?])(\s|$)/.exec(text.trim());
  const s = m ? m[1]! : text.trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s;
}

