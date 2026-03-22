/**
 * Auto-validation for trusted users.
 *
 * Users with trust_score >= TRUSTED_THRESHOLD bypass the moderation
 * queue — their submissions are instantly approved. The exception:
 * potential duplicates still go through manual review.
 */

import { getEffectiveRole } from '@/lib/trust'

/** Minimum trust score for auto-validation */
const TRUSTED_THRESHOLD = 100

/**
 * Determine if a submission should be auto-validated.
 *
 * Returns true when ALL of:
 * 1. User's effective role is 'trusted', 'moderator', or 'admin'
 * 2. The submission is NOT flagged as a potential duplicate
 */
export function shouldAutoValidate(
  trustScore: number,
  role: string | null,
  potentialDuplicate: boolean
): boolean {
  if (potentialDuplicate) return false

  const effectiveRole = getEffectiveRole(trustScore, role)
  const autoValidRoles = ['trusted', 'moderator', 'admin']

  return autoValidRoles.includes(effectiveRole.key)
}

/** Audit reason string for auto-validated submissions */
export const AUTO_VALIDATION_REASON = 'trusted_user' as const

/** Auto-validation result for audit logging */
export interface AutoValidationResult {
  autoValidated: boolean
  reason: typeof AUTO_VALIDATION_REASON | null
  trustScore: number
  effectiveRole: string
}

/**
 * Check auto-validation eligibility and return an audit-ready result.
 *
 * Used by the draft/suggestion creation flows to decide whether
 * to set status to 'approved' immediately.
 */
export function checkAutoValidation(
  trustScore: number,
  role: string | null,
  potentialDuplicate: boolean
): AutoValidationResult {
  const effectiveRole = getEffectiveRole(trustScore, role)
  const autoValidated = shouldAutoValidate(trustScore, role, potentialDuplicate)

  return {
    autoValidated,
    reason: autoValidated ? AUTO_VALIDATION_REASON : null,
    trustScore,
    effectiveRole: effectiveRole.key,
  }
}

/**
 * Get the current user's trust context.
 *
 * In the real app this would read from Supabase auth. For now
 * we read from localStorage mock or return a default.
 */
export function getCurrentUserTrust(): {
  trustScore: number
  role: string | null
} {
  if (typeof window === 'undefined') {
    return { trustScore: 0, role: null }
  }

  // Try reading from a mock localStorage key (for dev/testing)
  const mockTrust = localStorage.getItem('bleau-mock-trust-score')
  if (mockTrust) {
    try {
      const parsed = JSON.parse(mockTrust)
      return {
        trustScore: parsed.trustScore ?? 0,
        role: parsed.role ?? null,
      }
    } catch {
      // fall through
    }
  }

  return { trustScore: 0, role: null }
}
