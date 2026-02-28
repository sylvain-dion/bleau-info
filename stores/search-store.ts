import { create } from 'zustand'
import { searchBouldersAndSectors } from '@/lib/search'
import type { SearchResult } from '@/lib/search'

interface SearchState {
  /** Current search query */
  query: string
  /** Search results for current query */
  results: SearchResult[]
  /** Whether the search dropdown is open */
  isOpen: boolean
  /** Index of the highlighted result (keyboard navigation) */
  highlightedIndex: number

  setQuery: (query: string) => void
  setOpen: (open: boolean) => void
  setHighlightedIndex: (index: number) => void
  clear: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isOpen: false,
  highlightedIndex: -1,

  setQuery: (query) =>
    set({
      query,
      results: searchBouldersAndSectors(query),
      isOpen: query.length >= 2,
      highlightedIndex: -1,
    }),

  setOpen: (isOpen) => set({ isOpen }),

  setHighlightedIndex: (highlightedIndex) => set({ highlightedIndex }),

  clear: () =>
    set({
      query: '',
      results: [],
      isOpen: false,
      highlightedIndex: -1,
    }),
}))
