/** One search over everything in the app (pure, testable in Node). */
import { events, guides, heroCurios, heroes, shops, sophiaQuestions } from '@/data/seed';

export type ResultKind = 'Hero' | 'Event' | 'Curio' | 'Guide' | 'Shop item' | "Sophia's Test";
export interface SearchResult { kind: ResultKind; title: string; detail: string; href: string; score: number }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function score(q: string, title: string, body: string): number {
  const t = norm(title), b = norm(body);
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length && words.every((w) => t.includes(w) || b.includes(w))) return words.every((w) => t.includes(w)) ? 50 : 30;
  return 0;
}

export function searchEverything(query: string, limit = 40): SearchResult[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const out: SearchResult[] = [];
  const add = (r: Omit<SearchResult, 'score'>, body: string) => { const s = score(q, r.title, body); if (s) out.push({ ...r, score: s }); };
  for (const h of heroes) add({ kind: 'Hero', title: h.name, detail: `${h.rarity}★ ${h.element} ${h.unitType}`, href: `/hero/${h.id}` }, `${h.title} ${h.role}`);
  for (const e of events) add({ kind: 'Event', title: e.name, detail: e.cadence, href: `/event/${e.id}` }, `${e.summary} ${e.category}`);
  for (const c of heroCurios) add({ kind: 'Curio', title: c.name, detail: `${c.heroName}'s curio`, href: heroes.some((h) => h.id === c.heroId) ? `/hero/${c.heroId}` : '/heroes' }, `${c.heroName} ${c.exclusive.map((a) => a.name).join(' ')}`);
  for (const g of guides) add({ kind: 'Guide', title: g.title, detail: g.summary, href: '/guides' }, g.sections.map((s) => `${s.heading} ${s.points.join(' ')}`).join(' '));
  for (const sh of shops) for (const it of sh.items) add({ kind: 'Shop item', title: it.name, detail: `${sh.name} · ${it.price}`, href: '/guides' }, sh.name);
  for (const s of sophiaQuestions) add({ kind: "Sophia's Test", title: s.answer, detail: s.question, href: `/tools/sophia?q=${encodeURIComponent(query.trim())}` }, `${s.question} ${s.keywords.join(' ')}`);
  const kindRank: Record<ResultKind, number> = { Hero: 0, Event: 1, Curio: 2, Guide: 3, 'Shop item': 4, "Sophia's Test": 5 };
  return out.sort((a, b) => b.score - a.score || kindRank[a.kind] - kindRank[b.kind] || a.title.localeCompare(b.title)).slice(0, limit);
}
