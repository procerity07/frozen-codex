import type { DataManifest, GameEvent, GiftCode, Hero, SophiaQuestion } from '@/types/game';
import { normalizeHero } from '@/lib/heroData';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isHero = (v: unknown): v is Hero => isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.element === 'string' && typeof v.rarity === 'number';
const isEvent = (v: unknown): v is GameEvent => isObj(v) && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.rules) && Array.isArray(v.days);
const isCode = (v: unknown): v is GiftCode => isObj(v) && typeof v.code === 'string' && typeof v.rewards === 'string';
const isQ = (v: unknown): v is SophiaQuestion => isObj(v) && typeof v.id === 'string' && typeof v.question === 'string' && typeof v.answer === 'string';

/** Validates an untrusted manifest; invalid rows are dropped rather than failing the whole pack. */
export function parseManifest(raw: unknown): DataManifest {
  if (!isObj(raw) || typeof raw.version !== 'number' || !isObj(raw.packs)) throw new Error('Manifest is missing version or packs');
  const p = raw.packs;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    version: raw.version,
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : '',
    packs: {
      heroes: arr(p.heroes).filter(isHero).map(normalizeHero),
      events: arr(p.events).filter(isEvent),
      giftCodes: arr(p.giftCodes).filter(isCode),
      sophia: arr(p.sophia).filter(isQ).map((q) => ({ ...q, keywords: Array.isArray(q.keywords) ? q.keywords : [] })),
    },
  };
}

