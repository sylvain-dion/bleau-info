/**
 * Guided circuit navigation store.
 *
 * Manages state for the turn-by-turn guided mode:
 * which circuit, current boulder index, user GPS position.
 * Not persisted — resets on page reload.
 */

import { create } from 'zustand'
import { getBoulderById } from '@/lib/data/boulder-service'
import type { BoulderDetail } from '@/lib/data/boulder-service'

interface GuidedModeState {
  /** Whether guided mode is active */
  isActive: boolean
  /** Circuit ID being navigated */
  circuitId: string | null
  /** Circuit color for display */
  circuitColor: string | null
  /** Ordered boulder IDs in this circuit */
  boulderIds: string[]
  /** Current boulder index (0-based) */
  currentIndex: number
  /** User GPS position (null if unavailable) */
  userPosition: { lat: number; lng: number } | null

  /** Start guided navigation on a circuit */
  startGuide: (circuitId: string, circuitColor: string, boulderIds: string[], startIndex?: number) => void
  /** Stop guided navigation */
  stopGuide: () => void
  /** Move to next boulder */
  goNext: () => void
  /** Move to previous boulder */
  goPrev: () => void
  /** Jump to specific index */
  goToIndex: (index: number) => void
  /** Update user GPS position */
  setUserPosition: (lat: number, lng: number) => void
  /** Get current boulder details */
  getCurrentBoulder: () => BoulderDetail | null
  /** Get next boulder details */
  getNextBoulder: () => BoulderDetail | null
}

export const useGuidedModeStore = create<GuidedModeState>()((set, get) => ({
  isActive: false,
  circuitId: null,
  circuitColor: null,
  boulderIds: [],
  currentIndex: 0,
  userPosition: null,

  startGuide: (circuitId, circuitColor, boulderIds, startIndex = 0) => {
    set({
      isActive: true,
      circuitId,
      circuitColor,
      boulderIds,
      currentIndex: Math.min(startIndex, boulderIds.length - 1),
    })
  },

  stopGuide: () => {
    set({
      isActive: false,
      circuitId: null,
      circuitColor: null,
      boulderIds: [],
      currentIndex: 0,
      userPosition: null,
    })
  },

  goNext: () => {
    const { currentIndex, boulderIds } = get()
    if (currentIndex < boulderIds.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  goPrev: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  goToIndex: (index) => {
    const { boulderIds } = get()
    if (index >= 0 && index < boulderIds.length) {
      set({ currentIndex: index })
    }
  },

  setUserPosition: (lat, lng) => {
    set({ userPosition: { lat, lng } })
  },

  getCurrentBoulder: () => {
    const { boulderIds, currentIndex } = get()
    const id = boulderIds[currentIndex]
    return id ? getBoulderById(id) ?? null : null
  },

  getNextBoulder: () => {
    const { boulderIds, currentIndex } = get()
    const id = boulderIds[currentIndex + 1]
    return id ? getBoulderById(id) ?? null : null
  },
}))
