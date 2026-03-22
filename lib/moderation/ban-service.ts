/**
 * Ban/suspension service.
 *
 * Orchestrates ban actions: updates ban store, rejects pending
 * submissions, creates audit log entries.
 */

import { useBanStore } from '@/stores/ban-store'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useAuditLogStore } from '@/stores/audit-log-store'

export interface BanActionResult {
  success: boolean
  rejectedSubmissions: number
  error?: string
}

/**
 * Ban a user permanently.
 *
 * 1. Creates ban record
 * 2. Auto-rejects all pending submissions
 * 3. Creates audit log entry
 */
export function performBan(
  userId: string,
  displayName: string,
  reason: string,
  moderatorId: string
): BanActionResult {
  try {
    useBanStore.getState().banUser(userId, displayName, reason, moderatorId)

    const rejected = rejectPendingSubmissions(userId)

    useAuditLogStore.getState().addEntry({
      submissionId: userId,
      submissionType: 'draft',
      boulderName: `[Ban] ${displayName}`,
      action: 'rejected',
      reason: `Utilisateur banni: ${reason}`,
      trustScore: 0,
      effectiveRole: 'moderator',
    })

    console.log(
      `[Ban] User ${displayName} (${userId}) banned by ${moderatorId} — ${rejected} submissions rejected`
    )

    return { success: true, rejectedSubmissions: rejected }
  } catch (err) {
    return {
      success: false,
      rejectedSubmissions: 0,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

/**
 * Suspend a user temporarily.
 */
export function performSuspension(
  userId: string,
  displayName: string,
  until: string,
  reason: string,
  moderatorId: string
): BanActionResult {
  try {
    useBanStore
      .getState()
      .suspendUser(userId, displayName, until, reason, moderatorId)

    const rejected = rejectPendingSubmissions(userId)

    useAuditLogStore.getState().addEntry({
      submissionId: userId,
      submissionType: 'draft',
      boulderName: `[Suspension] ${displayName}`,
      action: 'rejected',
      reason: `Utilisateur suspendu jusqu'au ${new Date(until).toLocaleDateString('fr-FR')}: ${reason}`,
      trustScore: 0,
      effectiveRole: 'moderator',
    })

    console.log(
      `[Ban] User ${displayName} (${userId}) suspended until ${until} by ${moderatorId}`
    )

    return { success: true, rejectedSubmissions: rejected }
  } catch (err) {
    return {
      success: false,
      rejectedSubmissions: 0,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

/**
 * Lift a ban or suspension.
 */
export function performUnban(
  userId: string,
  displayName: string,
  moderatorId: string
): { success: boolean } {
  try {
    useBanStore.getState().unbanUser(userId)

    useAuditLogStore.getState().addEntry({
      submissionId: userId,
      submissionType: 'draft',
      boulderName: `[Réhabilitation] ${displayName}`,
      action: 'manually_approved',
      reason: 'Droits de contribution rétablis',
      trustScore: 0,
      effectiveRole: 'moderator',
    })

    console.log(
      `[Ban] User ${displayName} (${userId}) unbanned by ${moderatorId}`
    )

    return { success: true }
  } catch {
    return { success: false }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reject all pending submissions from a user.
 *
 * Since we don't track userId on submissions in the mock,
 * this is a stub that returns 0. In production, it would
 * query by author_id and bulk-reject.
 */
function rejectPendingSubmissions(_userId: string): number {
  // Stub: In production, filter drafts/suggestions by author_id
  // For now, we don't have userId on submissions
  void _userId
  void useBoulderDraftStore
  void useSuggestionStore
  return 0
}
