import { describe, it, expect, beforeEach } from 'vitest'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { BoulderSuggestionInput } from '@/stores/suggestion-store'

/** Minimal valid suggestion input for reuse across tests. */
const validInput: BoulderSuggestionInput = {
  originalBoulderId: 'cul-de-chien-1',
  originalSnapshot: {
    name: 'La Marie-Rose',
    grade: '6a',
    style: 'dalle',
    sector: 'Cul de Chien',
    exposure: 'soleil',
    strollerAccessible: false,
    latitude: 48.3815,
    longitude: 2.6345,
  },
  name: 'La Marie-Rose',
  grade: '6a+',
  style: 'dalle',
  sector: 'Cul de Chien',
  description: 'Cotation réévaluée après consensus',
  height: null,
  exposure: 'soleil',
  strollerAccessible: false,
  photoBlurHash: null,
  photoWidth: null,
  photoHeight: null,
  latitude: 48.3815,
  longitude: 2.6345,
  topoDrawing: null,
}

describe('suggestion-store', () => {
  beforeEach(() => {
    useSuggestionStore.setState({ suggestions: [] })
  })

  it('should start with empty suggestions', () => {
    expect(useSuggestionStore.getState().suggestions).toHaveLength(0)
  })

  it('should add a suggestion and return its id', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    expect(id).toBeTruthy()
    const suggestions = useSuggestionStore.getState().suggestions
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].name).toBe('La Marie-Rose')
    expect(suggestions[0].grade).toBe('6a+')
    expect(suggestions[0].originalBoulderId).toBe('cul-de-chien-1')
    expect(suggestions[0].createdAt).toBeTruthy()
    expect(suggestions[0].updatedAt).toBeTruthy()
  })

  it('should default moderationStatus to pending', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    const suggestion = useSuggestionStore.getState().getSuggestion(id)
    expect(suggestion).toBeDefined()
    expect(suggestion!.moderationStatus).toBe('pending')
  })

  it('should default syncStatus to local', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    const suggestion = useSuggestionStore.getState().getSuggestion(id)
    expect(suggestion).toBeDefined()
    expect(suggestion!.syncStatus).toBe('local')
  })

  it('should prepend new suggestions (newest first)', () => {
    useSuggestionStore.getState().addSuggestion({ ...validInput, grade: '6a' })
    useSuggestionStore.getState().addSuggestion({ ...validInput, grade: '6b' })

    const suggestions = useSuggestionStore.getState().suggestions
    expect(suggestions).toHaveLength(2)
    expect(suggestions[0].grade).toBe('6b')
    expect(suggestions[1].grade).toBe('6a')
  })

  it('should store the original snapshot', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    const suggestion = useSuggestionStore.getState().getSuggestion(id)
    expect(suggestion!.originalSnapshot).toEqual({
      name: 'La Marie-Rose',
      grade: '6a',
      style: 'dalle',
      sector: 'Cul de Chien',
      exposure: 'soleil',
      strollerAccessible: false,
      latitude: 48.3815,
      longitude: 2.6345,
    })
  })

  it('should remove a suggestion by id', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)
    expect(useSuggestionStore.getState().suggestions).toHaveLength(1)

    useSuggestionStore.getState().removeSuggestion(id)
    expect(useSuggestionStore.getState().suggestions).toHaveLength(0)
  })

  it('should not fail when removing non-existent suggestion', () => {
    useSuggestionStore.getState().removeSuggestion('non-existent')
    expect(useSuggestionStore.getState().suggestions).toHaveLength(0)
  })

  it('should get a suggestion by id', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    const suggestion = useSuggestionStore.getState().getSuggestion(id)
    expect(suggestion).toBeDefined()
    expect(suggestion!.id).toBe(id)
  })

  it('should return undefined for non-existent suggestion', () => {
    expect(
      useSuggestionStore.getState().getSuggestion('non-existent')
    ).toBeUndefined()
  })

  describe('getSuggestionsForBoulder', () => {
    it('should return suggestions for a specific boulder', () => {
      useSuggestionStore.getState().addSuggestion(validInput)
      useSuggestionStore.getState().addSuggestion({
        ...validInput,
        originalBoulderId: 'bas-cuvier-3',
      })
      useSuggestionStore.getState().addSuggestion({
        ...validInput,
        grade: '6b',
      })

      const forCulDeChien = useSuggestionStore
        .getState()
        .getSuggestionsForBoulder('cul-de-chien-1')
      expect(forCulDeChien).toHaveLength(2)

      const forBasCuvier = useSuggestionStore
        .getState()
        .getSuggestionsForBoulder('bas-cuvier-3')
      expect(forBasCuvier).toHaveLength(1)
    })

    it('should return empty array when no suggestions for boulder', () => {
      useSuggestionStore.getState().addSuggestion(validInput)

      const results = useSuggestionStore
        .getState()
        .getSuggestionsForBoulder('unknown-boulder')
      expect(results).toHaveLength(0)
    })
  })

  describe('photo metadata', () => {
    it('should store photo metadata with suggestion', () => {
      const id = useSuggestionStore.getState().addSuggestion({
        ...validInput,
        photoBlurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
        photoWidth: 1200,
        photoHeight: 800,
      })

      const suggestion = useSuggestionStore.getState().getSuggestion(id)
      expect(suggestion!.photoBlurHash).toBe('LEHV6nWB2yk8pyo0adR*.7kCMdnj')
      expect(suggestion!.photoWidth).toBe(1200)
      expect(suggestion!.photoHeight).toBe(800)
    })
  })
})
