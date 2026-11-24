/**
 * Pure hive-planner logic (no React Native imports, so it is testable in Node).
 * The plan is a grid of map tiles. Castles, the Fort, the Gate and Alliance Gather cover 2×2 tiles;
 * outposts and blocked spots cover 1 tile. Coordinates step 1 per tile.
 */

export type PieceKind = 'member' | 'fort' | 'gate' | 'gather' | 'outpost' | 'blocked';
export type HiveColor = 'gold' | 'red' | 'orange' | 'purple' | 'green' | 'blue' | 'pink' | 'grey';

export interface HivePiece { id: string; kind: PieceKind; col: number; row: number; size: number; name?: string; color?: HiveColor }

export interface Hive {
  v: 2;
  id: string;
  name: string;
  /** Plan size in map tiles. */
  cols: number;
  rows: number;
  pieces: HivePiece[];
  /** A tile whose in-game coordinates are known. */
  ref: { col: number; row: number; x: number; y: number };
  /** Whether in-game Y grows going down the plan (true) or up (false). */
  yDown: boolean;
  members: string[];
  /** What each colour means in this plan (editable). */
  legend: Record<HiveColor, string>;
  /** Width of an outpost's territory in map tiles (shown as a green outline). */
  outpostTiles?: number;
}

export const KIND_LABELS: Record<PieceKind, string> = {
  member: 'Member castle', fort: 'Fort', gate: 'Gate', gather: 'Alliance Gather', outpost: 'Outpost', blocked: 'Blocked',
};
export const KIND_SIZE: Record<PieceKind, number> = { member: 2, fort: 2, gate: 2, gather: 2, outpost: 1, blocked: 1 };

/** Order shown in the picker: Alliance member, Farm, Alliance building first. */
export const HIVE_COLORS: HiveColor[] = ['gold', 'green', 'blue', 'red', 'orange', 'purple', 'pink', 'grey'];
export const HIVE_COLOR_HEX: Record<HiveColor, string> = {
  gold: '#F5B83D', red: '#EF4444', orange: '#F97316', purple: '#A855F7', green: '#22C55E', blue: '#38BDF8', pink: '#EC4899', grey: '#94A3B8',
};
export const DEFAULT_LEGEND: Record<HiveColor, string> = {
  gold: 'Alliance member', green: 'Farm', blue: 'Alliance building', red: 'R4 / R5', orange: 'Rally leader', purple: 'Ally / guest', pink: 'Other', grey: 'Inactive',
};
/** Colour every new member castle gets automatically. */
export const MEMBER_COLOR: HiveColor = 'gold';
/** Labels from the first version; plans still using them get the new defaults. */
const OLD_DEFAULTS: Record<HiveColor, string> = {
  gold: 'R4 / R5', red: 'Rally leader', orange: 'Fighter', purple: 'Support', green: 'Farm', blue: 'Alliance building', pink: 'Ally / guest', grey: 'Inactive',
};
const isColor = (c: unknown): c is HiveColor => typeof c === 'string' && (HIVE_COLORS as string[]).includes(c);
const KINDS = Object.keys(KIND_SIZE) as PieceKind[];
const isKind = (k: unknown): k is PieceKind => typeof k === 'string' && (KINDS as string[]).includes(k);

export const MAX_SIDE = 60;
export const DEFAULT_OUTPOST_TILES = 10;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(n) ? n : lo)));
let seq = 0;
export const pieceId = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;

export function newHive(id: string, name = 'Main hive', cols = 24, rows = 24): Hive {
  const c = clamp(cols, 2, MAX_SIDE);
  const r = clamp(rows, 2, MAX_SIDE);
  const fort: HivePiece = { id: pieceId(), kind: 'fort', col: Math.floor(c / 2) - 1, row: Math.floor(r / 2) - 1, size: 2, color: 'blue' };
  return { v: 2, id, name, cols: c, rows: r, pieces: [fort], ref: { col: 0, row: r - 2, x: 0, y: 0 }, yDown: true, members: [], legend: { ...DEFAULT_LEGEND } };
}

const covers = (p: HivePiece, col: number, row: number) => col >= p.col && col < p.col + p.size && row >= p.row && row < p.row + p.size;
export const pieceAt = (h: Hive, col: number, row: number) => h.pieces.find((p) => covers(p, col, row)) ?? null;

/** True when a piece of `size` fits at col/row inside the plan without overlapping others (except `ignoreId`). */
export function canPlace(h: Hive, col: number, row: number, size: number, ignoreId?: string): boolean {
  if (col < 0 || row < 0 || col + size > h.cols || row + size > h.rows) return false;
  return !h.pieces.some((p) => p.id !== ignoreId && p.col < col + size && col < p.col + p.size && p.row < row + size && row < p.row + p.size);
}

function cleanPiece(p: Partial<HivePiece> & { kind: PieceKind; col: number; row: number }): HivePiece {
  const name = p.name?.trim().slice(0, 40);
  return {
    id: p.id ?? pieceId(), kind: p.kind, col: p.col, row: p.row, size: KIND_SIZE[p.kind],
    ...(p.kind === 'member' && name ? { name } : {}),
    ...(isColor(p.color) ? { color: p.color } : {}),
  };
}

/** Adds or replaces a piece. Returns null when it does not fit there (or a member castle has no name). */
export function putPiece(h: Hive, p: Partial<HivePiece> & { kind: PieceKind; col: number; row: number }): Hive | null {
  const piece = cleanPiece(p);
  if (piece.kind === 'member' && !piece.name) return null;
  if (!canPlace(h, piece.col, piece.row, piece.size, piece.id)) return null;
  return { ...h, pieces: [...h.pieces.filter((x) => x.id !== piece.id), piece] };
}

export const removePiece = (h: Hive, id: string): Hive => ({ ...h, pieces: h.pieces.filter((p) => p.id !== id) });

/** In-game coordinates of a tile, from the reference tile. A piece's coordinates are those of its top-left tile. */
export function coordsOf(h: Hive, col: number, row: number): { x: number; y: number } {
  const dy = row - h.ref.row;
  return { x: h.ref.x + (col - h.ref.col), y: h.ref.y + (h.yDown ? dy : -dy) };
}

/** Resizes the plan; pieces that no longer fit are removed. */
export function resize(h: Hive, cols: number, rows: number): Hive {
  const c = clamp(cols, 2, MAX_SIDE);
  const r = clamp(rows, 2, MAX_SIDE);
  return {
    ...h, cols: c, rows: r,
    pieces: h.pieces.filter((p) => p.col + p.size <= c && p.row + p.size <= r),
    ref: { ...h.ref, col: Math.min(h.ref.col, c - 1), row: Math.min(h.ref.row, r - 1) },
  };
}

export const placedNames = (h: Hive) => new Set(h.pieces.filter((p) => p.kind === 'member' && p.name).map((p) => p.name!.toLowerCase()));
export const unplaced = (h: Hive) => { const p = placedNames(h); return h.members.filter((m) => !p.has(m.toLowerCase())); };

/** Splits pasted text (one name per line, or comma-separated) into unique names. */
export function parseMembers(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const n = raw.trim().slice(0, 40);
    if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push(n); }
  }
  return out.slice(0, 300);
}

export function findName(h: Hive, query: string): HivePiece[] {
  const q = query.trim().toLowerCase();
  return q ? h.pieces.filter((p) => p.kind === 'member' && p.name?.toLowerCase().includes(q)) : [];
}

/** Tile ranges covered by each outpost's territory, clipped to the plan. */
export function outpostAreas(h: Hive): { col0: number; row0: number; col1: number; row1: number }[] {
  const span = Math.max(1, h.outpostTiles ?? DEFAULT_OUTPOST_TILES);
  const before = Math.floor((span - 1) / 2);
  const after = span - 1 - before;
  return h.pieces.filter((p) => p.kind === 'outpost').map((p) => ({
    col0: Math.max(0, p.col - before), row0: Math.max(0, p.row - before),
    col1: Math.min(h.cols - 1, p.col + after), row1: Math.min(h.rows - 1, p.row + after),
  }));
}

/** Fills in any missing colour labels (older plans and imports). */
export function normalizeLegend(raw: unknown): Record<HiveColor, string> {
  const r = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_LEGEND };
  for (const c of HIVE_COLORS) {
    const v = typeof r[c] === 'string' ? (r[c] as string).trim() : '';
    if (v && v !== OLD_DEFAULTS[c]) out[c] = v.slice(0, 24);
  }
  return out;
}

/** Brings any saved or imported plan (including first-version square plans) to the tile format. */
export function migrateHive(raw: unknown): Hive {
  const h = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const id = typeof h.id === 'string' ? h.id : pieceId();
  const name = typeof h.name === 'string' && h.name.trim() ? h.name.trim().slice(0, 40) : 'Hive';
  const ref = (typeof h.ref === 'object' && h.ref ? h.ref : {}) as Record<string, unknown>;
  const members = Array.isArray(h.members) ? parseMembers(h.members.filter((m) => typeof m === 'string').join('\n')) : [];
  const base = { v: 2 as const, id, name, yDown: h.yDown !== false, members, legend: normalizeLegend(h.legend), outpostTiles: clamp(Number(h.outpostTiles ?? DEFAULT_OUTPOST_TILES), 2, 40) };
  const refXY = { x: clamp(Number(ref.x), 0, 99999), y: clamp(Number(ref.y), 0, 99999) };

  if (Array.isArray(h.cells)) {
    // First version: one square = one 2×2 castle.
    const cols = clamp(Number(h.cols), 1, 30);
    const rows = clamp(Number(h.rows), 1, 30);
    let out: Hive = { ...base, cols: cols * 2, rows: rows * 2, pieces: [], ref: { col: clamp(Number(ref.col), 0, cols - 1) * 2, row: clamp(Number(ref.row), 0, rows - 1) * 2, ...refXY } };
    (h.cells as unknown[]).forEach((cell, i) => {
      const c = (typeof cell === 'object' && cell ? cell : {}) as Record<string, unknown>;
      const col = (i % cols) * 2;
      const row = Math.floor(i / cols) * 2;
      const color = isColor(c.color) ? c.color : undefined;
      const kind = c.kind === 'marker' ? 'outpost' : c.kind;
      const add = (p: Partial<HivePiece> & { kind: PieceKind; col: number; row: number }) => { const n = putPiece(out, p); if (n) out = n; };
      if (kind === 'member' && typeof c.name === 'string') add({ kind: 'member', col, row, name: c.name, color });
      else if (kind === 'fort' || kind === 'gate' || kind === 'gather' || kind === 'outpost') add({ kind, col, row, color });
      else if (kind === 'blocked') for (const [dc, dr] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) add({ kind: 'blocked', col: col + dc, row: row + dr });
    });
    return out;
  }

  const cols = clamp(Number(h.cols ?? 24), 2, MAX_SIDE);
  const rows = clamp(Number(h.rows ?? 24), 2, MAX_SIDE);
  let out: Hive = { ...base, cols, rows, pieces: [], ref: { col: clamp(Number(ref.col), 0, cols - 1), row: clamp(Number(ref.row), 0, rows - 1), ...refXY } };
  for (const p of Array.isArray(h.pieces) ? h.pieces : []) {
    const q = (typeof p === 'object' && p ? p : {}) as Record<string, unknown>;
    if (!isKind(q.kind)) continue;
    const next = putPiece(out, { id: typeof q.id === 'string' ? q.id : undefined, kind: q.kind, col: Number(q.col), row: Number(q.row), name: typeof q.name === 'string' ? q.name : undefined, color: isColor(q.color) ? q.color : undefined });
    if (next) out = next;
  }
  return out;
}

const PREFIX2 = 'FCHIVE2:';
const PREFIX1 = 'FCHIVE1:';
const CODE: Record<PieceKind, string> = { member: 'm', fort: 'F', gate: 'G', gather: 'A', outpost: 'T', blocked: 'X' };
const FROM_CODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k])) as Record<string, PieceKind>;

/** Text code to share a plan in chat; paste it into Import on another phone. */
export function exportCode(h: Hive): string {
  const p = h.pieces.map((x) => [CODE[x.kind], x.col, x.row, x.name ?? '', x.color ?? '']);
  return PREFIX2 + JSON.stringify({ n: h.name, c: h.cols, r: h.rows, p, ref: h.ref, yd: h.yDown, l: h.members, lg: h.legend, ot: h.outpostTiles ?? DEFAULT_OUTPOST_TILES });
}

/** Reads a shared code (tile codes and first-version square codes). Throws a readable error when invalid. */
export function importCode(text: string, id: string): Hive {
  const t = text.trim();
  const i2 = t.indexOf(PREFIX2);
  const i1 = t.indexOf(PREFIX1);
  if (i2 < 0 && i1 < 0) throw new Error('This is not a hive plan code.');
  const start = i2 >= 0 ? i2 + PREFIX2.length : i1 + PREFIX1.length;
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(t.slice(start)) as Record<string, unknown>; } catch { throw new Error('The code is incomplete. Copy the whole message.'); }
  if (i2 < 0) {
    // First-version code: squares.
    const cols = clamp(Number(raw.c), 1, 30);
    const rows = clamp(Number(raw.r), 1, 30);
    const grid = typeof raw.g === 'string' ? raw.g : '';
    const names = (typeof raw.m === 'object' && raw.m ? raw.m : {}) as Record<string, unknown>;
    const colors = (typeof raw.k === 'object' && raw.k ? raw.k : {}) as Record<string, unknown>;
    const old: Record<string, string> = { '.': 'empty', m: 'member', F: 'fort', G: 'gate', A: 'gather', T: 'marker', X: 'blocked' };
    const cells = Array.from({ length: cols * rows }, (_, i) => ({ kind: old[grid[i] ?? '.'] ?? 'empty', name: names[i], color: colors[i] }));
    return migrateHive({ id, name: raw.n, cols, rows, cells, ref: raw.ref, yDown: raw.yd, members: raw.l, legend: raw.lg, outpostTiles: raw.ot });
  }
  const pieces = (Array.isArray(raw.p) ? raw.p : []).map((x) => {
    const a = Array.isArray(x) ? x : [];
    return { kind: FROM_CODE[String(a[0])], col: Number(a[1]), row: Number(a[2]), name: typeof a[3] === 'string' ? a[3] : undefined, color: a[4] || undefined };
  });
  return migrateHive({ id, name: raw.n, cols: raw.c, rows: raw.r, pieces, ref: raw.ref, yDown: raw.yd, members: raw.l, legend: raw.lg, outpostTiles: raw.ot });
}
