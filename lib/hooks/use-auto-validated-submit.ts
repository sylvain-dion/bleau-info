'use client'

import { useCallback } from 'react'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useAuditLogStore } from '@/stores/audit-log-store'
import {
  checkAutoValidation,
  getCurrentUserTrust,
  AUTO_VALIDATION_REASON,
} from '@/lib/moderation/auto-validation'

interface AutoValidatedResult {
  id: string
  autoValidated: boolean
}

/**
 * Hook that wraps draft submission with auto-validation.
 *
 * If the current user is trusted and the draft is not a duplicate,
 * the draft is instantly approved + an audit log entry is created.
 */
export function useAutoValidatedDraftSubmit() {
  const addDraft = useBoulderDraftStore((s) => s.addDraft)
  const addAudit = useAuditLogStore((s) => s.addEntry)

  return useCallback(
    (
      data: Parameters<typeof addDraft>[0],
      potentialDuplicate: boolean
    ): AutoValidatedResult => {
      const id = addDraft(data)

      const { trustScore, role } = getCurrentUserTrust()
      const check = checkAutoValidation(trustScore, role, potentialDuplicate)

      if (check.autoValidated) {
        // Set to approved immediately
        useBoulderDraftStore.setState((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id ? { ...d, status: 'approved' as const } : d
          ),
        }))

        addAudit({
          submissionId: id,
          submissionType: 'draft',
          boulderName: data.name,
          action: 'auto_approved',
          reason: AUTO_VALIDATION_REASON,
          trustScore: check.trustScore,
          effectiveRole: check.effectiveRole,
        })
      }

      return { id, autoValidated: check.autoValidated }
    },
    [addDraft, addAudit]
  )
}

/**
 * Hook that wraps suggestion submission with auto-validation.
 */
export function useAutoValidatedSuggestionSubmit() {
  const addSuggestion = useSuggestionStore((s) => s.addSuggestion)
  const addAudit = useAuditLogStore((s) => s.addEntry)

  return useCallback(
    (data: Parameters<typeof addSuggestion>[0]): AutoValidatedResult => {
      const id = addSuggestion(data)

      // Suggestions don't have potentialDuplicate — always eligible
      const { trustScore, role } = getCurrentUserTrust()
      const check = checkAutoValidation(trustScore, role, false)

      if (check.autoValidated) {
        useSuggestionStore.getState().setModerationStatus(id, 'approved')

        addAudit({
          submissionId: id,
          submissionType: 'suggestion',
          boulderName: data.name,
          action: 'auto_approved',
          reason: AUTO_VALIDATION_REASON,
          trustScore: check.trustScore,
          effectiveRole: check.effectiveRole,
        })
      }

      return { id, autoValidated: check.autoValidated }
    },
    [addSuggestion, addAudit]
  )
}
