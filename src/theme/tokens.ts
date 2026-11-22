/**
 * "Glacial Obsidian & Citadel Gold" design tokens.
 * Every colour in the app must come from this file.
 */
export const palette = {
  bg: '#090E17',
  surface: '#111927',
  border: '#1E293B',
  borderStrong: '#2A3A52',
  modal: '#182235',
  overlay: 'rgba(4, 7, 12, 0.72)',
  cyan: '#38BDF8',
  cyanDim: 'rgba(56, 189, 248, 0.14)',
  cyanLine: 'rgba(56, 189, 248, 0.35)',
  gold: '#F59E0B',
  goldDim: 'rgba(245, 158, 11, 0.14)',
  goldLine: 'rgba(245, 158, 11, 0.35)',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.14)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.14)',
  warning: '#FACC15',
} as const;

export const elementColors = {
  Fire: '#EF4444',
  Ice: '#38BDF8',
  Nature: '#22C55E',
  Light: '#FACC15',
  Dark: '#A855F7',
} as const;

export const rarityColors = {
  2: '#94A3B8',
  3: '#3B82F6',
  4: '#A855F7',
  5: '#F59E0B',
  6: '#F43F5E',
} as const;

export const rarityLabels = {
  2: 'Uncommon',
  3: 'Rare',
  4: 'Epic',
  5: 'Mythic',
  6: 'Immortal',
} as const;

export const troopColors = {
  Infantry: '#60A5FA',
  Cavalry: '#F97316',
  Archer: '#4ADE80',
  'All-round': '#E2E8F0',
  Civil: '#F59E0B',
  All: '#38BDF8',
} as const;

export const tierColors = {
  SS: '#F43F5E',
  S: '#F59E0B',
  A: '#A855F7',
  B: '#3B82F6',
  C: '#94A3B8',
} as const;

export const verdictColors = {
  'Must Buy': '#22C55E',
  Situational: '#F59E0B',
  'Trap / Skip': '#EF4444',
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 6, md: 10, lg: 14, xl: 18 } as const;

/** Tint helper: '#RRGGBB' + alpha (0-1) -> rgba() */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
