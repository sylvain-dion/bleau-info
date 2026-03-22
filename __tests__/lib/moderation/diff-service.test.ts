import { describe, it, expect, beforeEach } from 'vitest'
import { buildSubmissionDiff } from '@/lib/moderation/diff-service'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { QueueItem } from '@/lib/moderation/queue-service'

function makeSuggestionQueueItem(id: string): QueueItem {
  return {
    id,
    type: 'modification',
    priority: 'modification',
    name: 'Bloc Test',
    grade: '6a',
    sector: 'Cul de Chien',
    style: 'dalle',
    author: 'Test User',
    submittedAt: '2026-03-20T10:00:00Z',
    reason: 'Modification proposée',
    potentialDuplicate: false,
    sourceType: 'suggestion',
    hasPhoto: false,
  }
}

function makeDraftQueueItem(id: string): QueueItem {
  return {
    id,
    type: 'creation',
    priority: 'creation',
    name: 'Nouveau Bloc',
    grade: '5a',
    sector: 'Bas Cuvier',
    style: 'devers',
    author: 'Test User',
    submittedAt: '2026-03-20T10:00:00Z',
    reason: 'Nouveau bloc à valider',
    potentialDuplicate: false,
    sourceType: 'draft',
    hasPhoto: false,
  }
}

describe('buildSubmissionDiff', () => {
  beforeEach(() => {
    useBoulderDraftStore.setState({ drafts: [] })
    useSuggestionStore.setState({ suggestions: [] })
  })

  it('returns empty diff when suggestion not found', () => {
    const item = makeSuggestionQueueItem('nonexistent')
    const diff = buildSubmissionDiff(item)

    expect(diff.fields).toHaveLength(0)
    expect(diff.isCreation).toBe(true)
  })

  it('returns empty diff when draft not found', () => {
    const item = makeDraftQueueItem('nonexistent')
    const diff = buildSubmissionDiff(item)

    expect(diff.fields).toHaveLength(0)
    expect(diff.isCreation).toBe(true)
  })

  it('builds suggestion diff with changed fields highlighted', () => {
    const suggestionId = 'suggestion-1'
    useSuggestionStore.setState({
      suggestions: [
        {
          id: suggestionId,
          originalBoulderId: 'boulder-1',
          originalSnapshot: {
            name: 'Pierre Philosophale',
            grade: '6a',
            style: 'dalle',
            sector: 'Cul de Chien',
            exposure: 'mi-ombre',
            strollerAccessible: false,
            latitude: 48.3815,
            longitude: 2.6345,
          },
          name: 'Pierre Philosophale',
          grade: '6b+', // changed
          style: 'dalle',
          sector: 'Cul de Chien',
          description: 'Belle dalle technique',
          height: 3.5,
          exposure: 'mi-ombre',
          strollerAccessible: false,
          photoBlurHash: null,
          photoWidth: null,
          photoHeight: null,
          latitude: 48.3815,
          longitude: 2.6345,
          topoDrawing: null,
          videoUrl: null,
          moderationStatus: 'pending',
          syncStatus: 'synced',
          createdAt: '2026-03-20T10:00:00Z',
          updatedAt: '2026-03-20T10:00:00Z',
        } as any,
      ],
    })

    const item = makeSuggestionQueueItem(suggestionId)
    const diff = buildSubmissionDiff(item)

    expect(diff.isCreation).toBe(false)
    expect(diff.originalName).toBe('Pierre Philosophale')
    expect(diff.fields.length).toBeGreaterThan(0)

    const gradeField = diff.fields.find((f) => f.key === 'grade')
    expect(gradeField).toBeDefined()
    expect(gradeField!.original).toBe('6a')
    expect(gradeField!.proposed).toBe('6b+')
    expect(gradeField!.changed).toBe(true)

    const nameField = diff.fields.find((f) => f.key === 'name')
    expect(nameField).toBeDefined()
    expect(nameField!.changed).toBe(false)
  })

  it('builds draft diff with isCreation=true and all fields marked changed', () => {
    const draftId = 'draft-1'
    useBoulderDraftStore.setState({
      drafts: [
        {
          id: draftId,
          name: 'Nouveau Bloc',
          grade: '5a',
          style: 'devers',
          sector: 'Bas Cuvier',
          description: 'Un nouveau dévers',
          height: 2.5,
          exposure: 'soleil',
          strollerAccessible: true,
          photoBlurHash: null,
          photoWidth: null,
          photoHeight: null,
          latitude: 48.445,
          longitude: 2.629,
          topoDrawing: null,
          videoUrl: null,
          potentialDuplicate: false,
          syncStatus: 'synced',
          status: 'pending',
          createdAt: '2026-03-20T10:00:00Z',
          updatedAt: '2026-03-20T10:00:00Z',
        } as any,
      ],
    })

    const item = makeDraftQueueItem(draftId)
    const diff = buildSubmissionDiff(item)

    expect(diff.isCreation).toBe(true)
    expect(diff.originalName).toBeNull()
    expect(diff.originalCoords).toBeNull()
    expect(diff.proposedCoords).toEqual({ lat: 48.445, lng: 2.629 })

    // All non-null fields should be marked changed for creations
    const nameField = diff.fields.find((f) => f.key === 'name')
    expect(nameField!.changed).toBe(true)
    expect(nameField!.original).toBeNull()
    expect(nameField!.proposed).toBe('Nouveau Bloc')
  })

  it('detects geographic field changes', () => {
    const suggestionId = 'geo-suggestion'
    useSuggestionStore.setState({
      suggestions: [
        {
          id: suggestionId,
          originalBoulderId: 'boulder-2',
          originalSnapshot: {
            name: 'Bloc Geo',
            grade: '4a',
            style: 'bloc',
            sector: 'Apremont',
            exposure: null,
            strollerAccessible: false,
            latitude: 48.381500,
            longitude: 2.634500,
          },
          name: 'Bloc Geo',
          grade: '4a',
          style: 'bloc',
          sector: 'Apremont',
          description: '',
          height: null,
          exposure: null,
          strollerAccessible: false,
          photoBlurHash: null,
          photoWidth: null,
          photoHeight: null,
          latitude: 48.382000, // changed ~55m
          longitude: 2.635000,
          topoDrawing: null,
          videoUrl: null,
          moderationStatus: 'pending',
          syncStatus: 'synced',
          createdAt: '2026-03-20T10:00:00Z',
          updatedAt: '2026-03-20T10:00:00Z',
        } as any,
      ],
    })

    const item = makeSuggestionQueueItem(suggestionId)
    item.id = suggestionId
    const diff = buildSubmissionDiff(item)

    const latField = diff.fields.find((f) => f.key === 'latitude')
    expect(latField!.isGeo).toBe(true)
    expect(latField!.changed).toBe(true)

    expect(diff.originalCoords).toEqual({ lat: 48.381500, lng: 2.634500 })
    expect(diff.proposedCoords).toEqual({ lat: 48.382000, lng: 2.635000 })
  })
})
