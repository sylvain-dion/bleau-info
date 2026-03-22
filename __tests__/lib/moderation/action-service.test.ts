import { describe, it, expect, beforeEach } from 'vitest'
import {
  approveSubmission,
  rejectSubmission,
  requestCorrections,
} from '@/lib/moderation/action-service'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { QueueItem } from '@/lib/moderation/queue-service'

function makeDraftItem(id: string): QueueItem {
  return {
    id,
    type: 'creation',
    priority: 'creation',
    name: 'Test Draft',
    grade: '5a',
    sector: 'Bas Cuvier',
    style: 'dalle',
    author: 'Test',
    submittedAt: '2026-03-20T10:00:00Z',
    reason: 'Nouveau bloc',
    potentialDuplicate: false,
    sourceType: 'draft',
    hasPhoto: false,
  }
}

function makeSuggestionItem(id: string): QueueItem {
  return {
    id,
    type: 'modification',
    priority: 'modification',
    name: 'Test Suggestion',
    grade: '6a',
    sector: 'Cul de Chien',
    style: 'bloc',
    author: 'Test',
    submittedAt: '2026-03-20T10:00:00Z',
    reason: 'Modification',
    potentialDuplicate: false,
    sourceType: 'suggestion',
    hasPhoto: false,
  }
}

describe('action-service', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: 'draft-1',
          name: 'Test Draft',
          grade: '5a',
          style: 'dalle',
          sector: 'Bas Cuvier',
          status: 'pending',
          syncStatus: 'synced',
        } as any,
      ],
    })
    useSuggestionStore.setState({
      suggestions: [
        {
          id: 'suggestion-1',
          name: 'Test Suggestion',
          moderationStatus: 'pending',
          syncStatus: 'synced',
        } as any,
      ],
    })
  })

  describe('approveSubmission', () => {
    it('approves a draft', () => {
      const result = approveSubmission(makeDraftItem('draft-1'))
      expect(result.success).toBe(true)

      const draft = useBoulderDraftStore.getState().drafts[0]
      expect(draft.status).toBe('approved')
    })

    it('approves a suggestion', () => {
      const result = approveSubmission(makeSuggestionItem('suggestion-1'))
      expect(result.success).toBe(true)

      const suggestion = useSuggestionStore.getState().suggestions[0]
      expect(suggestion.moderationStatus).toBe('approved')
    })
  })

  describe('rejectSubmission', () => {
    it('rejects a draft with reason', () => {
      const result = rejectSubmission(
        makeDraftItem('draft-1'),
        'duplicate',
        'Déjà existant'
      )
      expect(result.success).toBe(true)

      const draft = useBoulderDraftStore.getState().drafts[0]
      expect(draft.status).toBe('rejected')
    })

    it('rejects a suggestion with reason', () => {
      const result = rejectSubmission(
        makeSuggestionItem('suggestion-1'),
        'quality',
        ''
      )
      expect(result.success).toBe(true)

      const suggestion = useSuggestionStore.getState().suggestions[0]
      expect(suggestion.moderationStatus).toBe('rejected')
    })
  })

  describe('requestCorrections', () => {
    it('requests corrections on a draft', () => {
      const result = requestCorrections(
        makeDraftItem('draft-1'),
        'Ajoutez une photo'
      )
      expect(result.success).toBe(true)

      const draft = useBoulderDraftStore.getState().drafts[0]
      expect(draft.status).toBe('changes_requested')
    })

    it('requests corrections on a suggestion', () => {
      const result = requestCorrections(
        makeSuggestionItem('suggestion-1'),
        'Vérifiez les coordonnées GPS'
      )
      expect(result.success).toBe(true)

      const suggestion = useSuggestionStore.getState().suggestions[0]
      expect(suggestion.moderationStatus).toBe('changes_requested')
    })
  })
})
