import { describe, it, expect, beforeEach } from 'vitest'
import { useSearchStore } from '@/stores/search-store'

describe('Search store', () => {
  beforeEach(() => {
    useSearchStore.getState().clear()
  })

  it('should initialize with empty state', () => {
    const state = useSearchStore.getState()
    expect(state.query).toBe('')
    expect(state.results).toEqual([])
    expect(state.isOpen).toBe(false)
    expect(state.highlightedIndex).toBe(-1)
  })

  describe('setQuery', () => {
    it('should update query and search results', () => {
      useSearchStore.getState().setQuery('cuvier')
      const state = useSearchStore.getState()
      expect(state.query).toBe('cuvier')
      expect(state.results.length).toBeGreaterThan(0)
      expect(state.isOpen).toBe(true)
    })

    it('should not open dropdown for short queries', () => {
      useSearchStore.getState().setQuery('a')
      const state = useSearchStore.getState()
      expect(state.query).toBe('a')
      expect(state.results).toEqual([])
      expect(state.isOpen).toBe(false)
    })

    it('should open dropdown for queries >= 2 chars', () => {
      useSearchStore.getState().setQuery('cu')
      expect(useSearchStore.getState().isOpen).toBe(true)
    })

    it('should reset highlightedIndex on new query', () => {
      useSearchStore.getState().setHighlightedIndex(3)
      useSearchStore.getState().setQuery('cuvier')
      expect(useSearchStore.getState().highlightedIndex).toBe(-1)
    })
  })

  describe('setOpen', () => {
    it('should update isOpen state', () => {
      useSearchStore.getState().setOpen(true)
      expect(useSearchStore.getState().isOpen).toBe(true)
      useSearchStore.getState().setOpen(false)
      expect(useSearchStore.getState().isOpen).toBe(false)
    })
  })

  describe('setHighlightedIndex', () => {
    it('should update the highlighted index', () => {
      useSearchStore.getState().setHighlightedIndex(2)
      expect(useSearchStore.getState().highlightedIndex).toBe(2)
    })
  })

  describe('clear', () => {
    it('should reset all state', () => {
      useSearchStore.getState().setQuery('cuvier')
      useSearchStore.getState().setHighlightedIndex(1)
      useSearchStore.getState().clear()

      const state = useSearchStore.getState()
      expect(state.query).toBe('')
      expect(state.results).toEqual([])
      expect(state.isOpen).toBe(false)
      expect(state.highlightedIndex).toBe(-1)
    })
  })
})
