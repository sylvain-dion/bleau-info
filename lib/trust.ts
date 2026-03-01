/**
 * Trust system configuration.
 *
 * Defines the role hierarchy, thresholds, UI labels (French),
 * and privilege descriptions. The actual `trust_score` column
 * will live in the database starting in Epic 7 — until then
 * we read from `user_metadata` with a default of 0.
 */

export type TrustRoleKey = 'user' | 'contributor' | 'trusted' | 'moderator' | 'admin'

export interface TrustRoleConfig {
  key: TrustRoleKey
  /** Display label in French */
  label: string
  /** Minimum trust_score to reach this level (null = role-based, not score-based) */
  threshold: number | null
  /** Tailwind color token used for badge/icon */
  color: string
  /** Emoji or icon identifier */
  icon: string
  /** Human-readable privilege description (FR) */
  privilege: string
  /** Sort order in the hierarchy */
  order: number
}

/**
 * Full role hierarchy from lowest to highest.
 *
 * Roles with a numeric threshold are unlocked by trust_score.
 * Roles with null threshold (moderator, admin) are assigned manually.
 */
export const TRUST_ROLES: readonly TrustRoleConfig[] = [
  {
    key: 'user',
    label: 'Utilisateur',
    threshold: 0,
    color: 'text-muted-foreground',
    icon: '👤',
    privilege: 'Vous pouvez consulter et explorer les blocs.',
    order: 0,
  },
  {
    key: 'contributor',
    label: 'Contributeur',
    threshold: 0,
    color: 'text-blue-500',
    icon: '✏️',
    privilege: 'Vos contributions sont soumises à la modération.',
    order: 1,
  },
  {
    key: 'trusted',
    label: 'Trusted',
    threshold: 100,
    color: 'text-primary',
    icon: '⭐',
    privilege: 'Vos ajouts de blocs sont validés instantanément.',
    order: 2,
  },
  {
    key: 'moderator',
    label: 'Modérateur',
    threshold: null,
    color: 'text-green-500',
    icon: '🛡️',
    privilege: 'Vous pouvez valider ou rejeter les contributions.',
    order: 3,
  },
  {
    key: 'admin',
    label: 'Admin',
    threshold: null,
    color: 'text-destructive',
    icon: '👑',
    privilege: 'Accès complet à l\u2019administration.',
    order: 4,
  },
] as const

/** Lookup a role config by its key. Falls back to 'user'. */
export function getRoleConfig(roleKey: string): TrustRoleConfig {
  return TRUST_ROLES.find((r) => r.key === roleKey) ?? TRUST_ROLES[0]
}

/**
 * Determine the effective displayed role.
 *
 * If a role string is set in user_metadata (e.g. "moderator"),
 * use that directly. Otherwise infer from trust_score:
 * - score >= 100 → trusted
 * - score > 0 → contributor
 * - default → user
 */
export function getEffectiveRole(score: number, role?: string | null): TrustRoleConfig {
  // Explicit role always wins (moderator, admin are manual assignments)
  if (role && TRUST_ROLES.some((r) => r.key === role)) {
    return getRoleConfig(role)
  }

  // Score-based inference
  if (score >= 100) return getRoleConfig('trusted')
  if (score > 0) return getRoleConfig('contributor')
  return getRoleConfig('user')
}

/**
 * Returns the next level config and the points needed, or null
 * if the user is already at max score-based level or has a
 * manually-assigned role (moderator/admin).
 */
export function getNextLevel(
  currentRole: TrustRoleConfig,
  score: number
): { role: TrustRoleConfig; pointsNeeded: number } | null {
  // Manually-assigned roles have no "next level" via score
  if (currentRole.threshold === null) return null

  // Find the next score-based role whose threshold the user hasn't reached yet
  const nextRole = TRUST_ROLES.find(
    (r) => r.threshold !== null && r.order > currentRole.order && (r.threshold as number) > score
  )
  if (!nextRole) return null

  const pointsNeeded = (nextRole.threshold as number) - score
  return { role: nextRole, pointsNeeded }
}

/**
 * Compute progress percentage toward the next level.
 * Returns 0–100. Returns 100 if at max level.
 */
export function getTrustProgress(score: number, currentRole: TrustRoleConfig): number {
  const next = getNextLevel(currentRole, score)
  if (!next) return 100 // at max level or manual role

  const nextThreshold = next.role.threshold as number
  const currentThreshold = currentRole.threshold ?? 0

  const range = nextThreshold - currentThreshold
  if (range <= 0) return 100

  const progress = ((score - currentThreshold) / range) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}
