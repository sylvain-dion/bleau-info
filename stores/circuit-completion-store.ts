/**
 * Zustand store for circuit completion dates.
 *
 * Only stores the date when a circuit was fully completed.
 * Progress itself is derived from tick-store (no duplication).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CompletionRecord {
  completedAt: string
}

interface CircuitCompletionState {
  completions: Record<string, CompletionRecord>

  /** Mark a circuit as fully completed (records timestamp) */
  markComplete: (circuitId: string) => void

  /** Check if a circuit has been completed */
  isCompleted: (circuitId: string) => boolean

  /** Get the completion date for a circuit */
  getCompletionDate: (circuitId: string) => string | null
}

export const useCircuitCompletionStore = create<CircuitCompletionState>()(
  persist(
    (set, get) => ({
      completions: {},

      markComplete: (circuitId) => {
        if (get().completions[circuitId]) return // Already recorded
        set((state) => ({
          completions: {
            ...state.completions,
            [circuitId]: { completedAt: new Date().toISOString() },
          },
        }))
      },

      isCompleted: (circuitId) => {
        return !!get().completions[circuitId]
      },

      getCompletionDate: (circuitId) => {
        return get().completions[circuitId]?.completedAt ?? null
      },
    }),
    { name: 'bleau-circuit-completions' }
  )
)
