/**
 * Zustand store for conflict records.
 *
 * Tracks geographic conflicts that require manual resolution
 * (LWW conflicts are auto-resolved and never stored here).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ConflictRecord,
  ConflictResolution,
  ConflictType,
  FieldDiff,
} from '@/lib/sync/types'

/** Input for creating a conflict (id + timestamps auto-generated) */
export interface ConflictInput {
  suggestionId: string
  boulderId: string
  boulderName: string
  conflictType: ConflictType
  diffs: FieldDiff[]
  localVersion: Record<string, unknown>
  remoteVersion: Record<string, unknown>
  distanceMeters: number | null
}

interface ConflictState {
  conflicts: ConflictRecord[]

  /** Add a new conflict record. Returns the generated ID. */
  addConflict: (data: ConflictInput) => string

  /** Resolve a conflict with a chosen resolution. */
  resolveConflict: (id: string, resolution: ConflictResolution) => void

  /** Get all unresolved conflicts. */
  getUnresolved: () => ConflictRecord[]

  /** Get a single conflict by ID. */
  getConflict: (id: string) => ConflictRecord | undefined

  /** Count of unresolved conflicts. */
  getConflictCount: () => number
}

function generateId(): string {
  return `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useConflictStore = create<ConflictState>()(
  persist(
    (set, get) => ({
      conflicts: [],

      addConflict(data) {
        const id = generateId()
        const record: ConflictRecord = {
          ...data,
          id,
          resolution: 'pending',
          createdAt: new Date().toISOString(),
          resolvedAt: null,
        }
        set((state) => ({
          conflicts: [record, ...state.conflicts],
        }))
        return id
      },

      resolveConflict(id, resolution) {
        set((state) => ({
          conflicts: state.conflicts.map((c) =>
            c.id === id
              ? { ...c, resolution, resolvedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      getUnresolved() {
        return get().conflicts.filter((c) => c.resolution === 'pending')
      },

      getConflict(id) {
        return get().conflicts.find((c) => c.id === id)
      },

      getConflictCount() {
        return get().conflicts.filter((c) => c.resolution === 'pending').length
      },
    }),
    {
      name: 'bleau-conflicts',
    }
  )
)
