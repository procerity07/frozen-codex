/** Pure hive-planner logic (no React Native imports, so it is testable in Node). */

export type CellKind = 'empty' | 'member' | 'fort' | 'gate' | 'gather' | 'marker' | 'blocked';

export type HiveColor = 'gold' | 'red' | 'orange' | 'purple' | 'green' | 'blue' | 'pink' | 'grey';

export interface HiveCell { kind: CellKind; name?: string; color?: HiveColor }

export const HIVE_COLORS: HiveColor[] = ['gold', 'red', 'orange', 'purple', 'green', 'blue', 'pink', 'grey'];
export const HIVE_COLOR_HEX: Record<HiveColor, string> = {
  gold: '#F5B83D', red: '#EF4444', orange: '#F97316', purple: '#A855F7', green: '#22C55E', blue: '#38BDF8', pink: '#EC4899', grey: '#94A3B8',
};
export const DEFAULT_LEGEND: Record<HiveColor, string> = {
  gold: 'R4 / R5', red: 'Rally leader', orange: 'Fighter', purple: 'Support', green: 'Farm', blue: 'Alliance building', pink: 'Ally / guest', grey: 'Inactive',
};
const isColor = (c: unknown): c is HiveColor => typeof c === 'string' && (HIVE_COLORS as string[]).includes(c);

export interface Hive {
  id: string;
  name: string;
  cols: number;
  rows: number;
  /** Row-major, length cols * rows. */
  cells: HiveCell[];
  /** A square whose in-game coordinates are known. */
  ref: { col: number; row: number; x: number; y: number };
  /** Map tiles between neighbouring squares (a castle is 2x2, so 2). */
  step: number;
  /** Whether in-game Y grows going down the plan (true) or up (false). */
  yDown: boolean;
  members: string[];
  /** What each colour means in this plan (editable). */
  legend: Record<HiveColor, string>;
}

export const KIND_LABELS: Record<CellKind, string> = {
  empty: 'Empty', member: 'Member', fort: 'Fort', gate: 'Gate', gather: 'Gather', marker: 'Outpost', blocked: 'Blocked',
};

export const MAX_SIDE = 30;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(n) ? n : lo)));

export function newHive(id: string, name = 'Main hive', cols = 12, rows = 12): Hive {
  const c = clamp(cols, 1, MAX_SIDE);
  const r = clamp(rows, 1, MAX_SIDE);
  const cells: HiveCell[] = Array.from({ length: c * r }, () => ({ kind: 'empty' as const }));
  const mid = Math.floor(r / 2) * c + Math.floor(c / 2);
  cells[mid] = { kind: 'fort' };
  return { id, name, cols: c, rows: r, cells, ref: { col: 0, row: r - 1, x: 0, y: 0 }, step: 2, yDown: true, members: [], legend: { ...DEFAULT_LEGEND } };
}

export const cellAt = (h: Hive, col: number, row: number): HiveCell => h.cells[row * h.cols + col] ?? { kind: 'empty' };

/** In-game coordinates of a square, from the reference square. */
export function coordsOf(h: Hive, col: number, row: number): { x: number; y: number } {
  const dy = (row - h.ref.row) * h.step;
  return { x: h.ref.x + (col - h.ref.col) * h.step, y: h.ref.y + (h.yDown ? dy : -dy) };
}

export function setCell(h: Hive, col: number, row: number, cell: HiveCell): Hive {
  const cells = h.cells.slice();
  const name = cell.name?.trim();
  const color = cell.kind !== 'empty' && isColor(cell.color) ? { color: cell.color } : {};
  cells[row * h.cols + col] = cell.kind === 'member' && name ? { kind: 'member', name, ...color } : cell.kind === 'member' ? { kind: 'empty' } : { kind: cell.kind, ...color };
  return { ...h, cells };
}

/** Resizes the grid, keeping squares that still fit (anchored top-left). */
export function resize(h: Hive, cols: number, rows: number): Hive {
  const c = clamp(cols, 1, MAX_SIDE);
  const r = clamp(rows, 1, MAX_SIDE);
  const cells: HiveCell[] = [];
  for (let row = 0; row < r; row++) for (let col = 0; col < c; col++) cells.push(col < h.cols && row < h.rows ? cellAt(h, col, row) : { kind: 'empty' });
  return { ...h, cols: c, rows: r, cells, ref: { ...h.ref, col: Math.min(h.ref.col, c - 1), row: Math.min(h.ref.row, r - 1) } };
}

export const placedNames = (h: Hive) => new Set(h.cells.filter((c) => c.kind === 'member' && c.name).map((c) => c.name!.toLowerCase()));

export const unplaced = (h: Hive) => { const p = placedNames(h); return h.members.filter((m) => !p.has(m.toLowerCase())); };

/** Splits pasted text (one name per line, or comma-separated) into unique names. */
export function parseMembers(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\n,;]+/)) {
    const n = raw.trim().slice(0, 40);
    if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push(n); }
  }
  return out.slice(0, 200);
}

export function findName(h: Hive, query: string): { col: number; row: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: { col: number; row: number }[] = [];
  h.cells.forEach((c, i) => { if (c.kind === 'member' && c.name?.toLowerCase().includes(q)) out.push({ col: i % h.cols, row: Math.floor(i / h.cols) }); });
  return out;
}

const PREFIX = 'FCHIVE1:';
const CODE: Record<CellKind, string> = { empty: '.', member: 'm', fort: 'F', gate: 'G', gather: 'A', marker: 'T', blocked: 'X' };
const FROM_CODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k])) as Record<string, CellKind>;

/** Text code to share a plan in chat; paste it into Import on another phone. */
export function exportCode(h: Hive): string {
  const names: Record<string, string> = {};
  const colors: Record<string, HiveColor> = {};
  h.cells.forEach((c, i) => { if (c.kind === 'member' && c.name) names[i] = c.name; if (c.color) colors[i] = c.color; });
  return PREFIX + JSON.stringify({ n: h.name, c: h.cols, r: h.rows, g: h.cells.map((c) => CODE[c.kind]).join(''), m: names, k: colors, lg: h.legend, ref: h.ref, s: h.step, yd: h.yDown, l: h.members });
}

/** Reads a shared code. Throws a readable error when it is not a valid plan. */
export function importCode(text: string, id: string): Hive {
  const t = text.trim();
  const start = t.indexOf(PREFIX);
  if (start < 0) throw new Error('This is not a hive plan code.');
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(t.slice(start + PREFIX.length)) as Record<string, unknown>; } catch { throw new Error('The code is incomplete. Copy the whole message.'); }
  const cols = clamp(Number(raw.c), 1, MAX_SIDE);
  const rows = clamp(Number(raw.r), 1, MAX_SIDE);
  const grid = typeof raw.g === 'string' ? raw.g : '';
  const names = (typeof raw.m === 'object' && raw.m ? raw.m : {}) as Record<string, unknown>;
  const colors = (typeof raw.k === 'object' && raw.k ? raw.k : {}) as Record<string, unknown>;
  const lg = (typeof raw.lg === 'object' && raw.lg ? raw.lg : {}) as Record<string, unknown>;
  const cells: HiveCell[] = Array.from({ length: cols * rows }, (_, i) => {
    const kind = FROM_CODE[grid[i] ?? '.'] ?? 'empty';
    const name = typeof names[i] === 'string' ? (names[i] as string).trim().slice(0, 40) : '';
    const color = kind !== 'empty' && isColor(colors[i]) ? { color: colors[i] as HiveColor } : {};
    return kind === 'member' ? (name ? { kind, name, ...color } : { kind: 'empty' }) : { kind, ...color };
  });
  const ref = (typeof raw.ref === 'object' && raw.ref ? raw.ref : {}) as Record<string, unknown>;
  return {
    id,
    name: typeof raw.n === 'string' && raw.n.trim() ? raw.n.trim().slice(0, 40) : 'Imported hive',
    cols, rows, cells,
    ref: { col: clamp(Number(ref.col), 0, cols - 1), row: clamp(Number(ref.row), 0, rows - 1), x: clamp(Number(ref.x), 0, 99999), y: clamp(Number(ref.y), 0, 99999) },
    step: clamp(Number(raw.s ?? 2), 1, 10),
    yDown: raw.yd !== false,
    members: Array.isArray(raw.l) ? parseMembers(raw.l.filter((x) => typeof x === 'string').join('\n')) : [],
    legend: normalizeLegend(lg),
  };
}

/** Fills in any missing colour labels (older plans and imports). */
export function normalizeLegend(raw: unknown): Record<HiveColor, string> {
  const r = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_LEGEND };
  for (const c of HIVE_COLORS) if (typeof r[c] === 'string' && (r[c] as string).trim()) out[c] = (r[c] as string).trim().slice(0, 24);
  return out;
}
