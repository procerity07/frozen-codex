import { COMBAT_ROLES, type CombatRole, type Hero, type HeroAudit, type HeroAuditField } from '@/types/game';

const AUDIT_FIELDS: readonly HeroAuditField[] = [
  'name', 'title', 'element', 'rarity', 'unitType', 'combatRole', 'marchSkills',
  'civilSkills', 'match3Skill', 'sources', 'bondGroups', 'exclusiveCurio', 'notes',
];

export const isCombatRole = (v: unknown): v is CombatRole => typeof v === 'string' && (COMBAT_ROLES as readonly string[]).includes(v);

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function normalizeAudit(v: unknown): HeroAudit | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const a = v as Record<string, unknown>;
  if (typeof a.checkedOn !== 'string') return undefined;
  return {
    checkedOn: a.checkedOn,
    verified: isStringArray(a.verified) ? (a.verified.filter((f) => (AUDIT_FIELDS as readonly string[]).includes(f)) as HeroAuditField[]) : [],
    sourceUrls: isStringArray(a.sourceUrls) ? a.sourceUrls.filter((u) => /^https:\/\//.test(u)) : [],
    notes: isStringArray(a.notes) ? a.notes : [],
  };
}

/**
 * Makes any stored or downloaded hero record safe to render: optional fields added after
 * the original schema (combatRole, audit, revision) are validated, and invalid values dropped.
 * Records written before these fields existed pass through unchanged.
 */
export function normalizeHero(h: Hero): Hero {
  const raw = h as Hero & Record<string, unknown>;
  const out: Hero = { ...h };
  if (!isCombatRole(raw.combatRole)) delete out.combatRole;
  const audit = normalizeAudit(raw.audit);
  if (audit) out.audit = audit; else delete out.audit;
  if (typeof raw.revision !== 'number' || !Number.isFinite(raw.revision) || raw.revision < 0) delete out.revision;
  // Tier ratings were removed from the app; older records and packs may still carry them.
  delete (out as Hero & { tiers?: unknown }).tiers;
  if (out.match3Skill && (typeof out.match3Skill !== 'object' || typeof out.match3Skill.name !== 'string')) delete out.match3Skill;
  if (!Array.isArray(out.marchSkills)) out.marchSkills = [];
  if (!Array.isArray(out.civilSkills)) out.civilSkills = [];
  if (!Array.isArray(out.sources)) out.sources = [];
  if (!Array.isArray(out.bondGroups)) out.bondGroups = [];
  return out;
}

/** Revision used for precedence; records without one are treated as revision 0. */
export const heroRevision = (h: Pick<Hero, 'revision'>): number => h.revision ?? 0;

export function isFieldVerified(h: Hero, field: HeroAuditField): boolean {
  return !!h.audit?.verified.includes(field);
}

/** What the Combat role section shows: a verified role, or the "Not verified" fallback (not a role). */
export function combatRoleLabel(h: Pick<Hero, 'combatRole'>): CombatRole | 'Not verified' {
  return isCombatRole(h.combatRole) ? h.combatRole : 'Not verified';
}
