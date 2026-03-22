/**
 * Moderation action service.
 *
 * Handles approve, reject, and request-corrections actions
 * on submissions (drafts + suggestions). Updates stores and
 * provides feedback. Trust score updates are stubbed.
 */

import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { QueueItem } from './queue-service'

/** Rejection reason presets */
export const REJECTION_REASONS = [
  { value: 'duplicate', label: 'Doublon' },
  { value: 'quality', label: 'Qualité insuffisante' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Autre' },
]
export type RejectionReason = (typeof REJECTION_REASONS)[number]['value']

/** Moderation status for drafts (extended from original 'draft' | 'pending') */
export type DraftModerationStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

/** Moderation status for suggestions */
export type SuggestionModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

/** Result of a moderation action */
export interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Approve a submission.
 *
 * - Marks draft/suggestion as approved
 * - In production: would UPSERT data, move photos, notify author
 * - Trust score +10 (stubbed)
 */
export function approveSubmission(item: QueueItem): ActionResult {
  try {
    if (item.sourceType === 'draft') {
      useBoulderDraftStore.getState().updateDraft(item.id, {})
      // Use the raw setState to set 'approved' status (not in the type union yet)
      useBoulderDraftStore.setState((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === item.id ? { ...d, status: 'approved' as const } : d
        ),
      }))
    } else {
      useSuggestionStore.getState().setModerationStatus(item.id, 'approved')
    }

    // Stub: trust_score += 10
    console.log(`[Moderation] Approved ${item.sourceType} ${item.id} — trust +10`)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

/**
 * Reject a submission.
 *
 * - Marks draft/suggestion as rejected
 * - Stores rejection reason and optional comment
 * - In production: would notify author with reason
 */
export function rejectSubmission(
  item: QueueItem,
  reason: RejectionReason,
  comment: string
): ActionResult {
  try {
    if (item.sourceType === 'draft') {
      useBoulderDraftStore.setState((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === item.id ? { ...d, status: 'rejected' as const } : d
        ),
      }))
    } else {
      useSuggestionStore.getState().setModerationStatus(item.id, 'rejected')
    }

    console.log(
      `[Moderation] Rejected ${item.sourceType} ${item.id} — reason: ${reason}${
        comment ? `, comment: ${comment}` : ''
      }`
    )

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

/**
 * Request corrections on a submission.
 *
 * - Sets status to 'changes_requested'
 * - In production: would notify author with instructions
 */
export function requestCorrections(
  item: QueueItem,
  instructions: string
): ActionResult {
  try {
    if (item.sourceType === 'draft') {
      useBoulderDraftStore.setState((state) => ({
        drafts: state.drafts.map((d) =>
          d.id === item.id
            ? { ...d, status: 'changes_requested' as const }
            : d
        ),
      }))
    } else {
      useSuggestionStore.getState().setModerationStatus(
        item.id,
        'changes_requested'
      )
    }

    console.log(
      `[Moderation] Corrections requested for ${item.sourceType} ${item.id}: ${instructions}`
    )

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
