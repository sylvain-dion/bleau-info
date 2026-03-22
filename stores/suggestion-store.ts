import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoulderStyleValue, BoulderExposureValue } from '@/lib/validations/boulder'
import type { TopoDrawing } from '@/lib/data/mock-topos'
import type { SyncStatus } from '@/lib/sync/types'

/** Snapshot of the original boulder data at the time the suggestion was made. */
export interface OriginalBoulderSnapshot {
  name: string
  grade: string
  style: BoulderStyleValue
  sector: string
  exposure: BoulderExposureValue | null
  strollerAccessible: boolean
  latitude: number | null
  longitude: number | null
}

/** A locally-stored suggestion to modify an existing boulder. */
export interface BoulderSuggestion {
  id: string
  /** ID of the existing boulder this suggestion targets. */
  originalBoulderId: string
  /** Frozen snapshot of the original values for diff display. */
  originalSnapshot: OriginalBoulderSnapshot

  /* ── Proposed values ── */
  name: string
  grade: string
  style: BoulderStyleValue
  sector: string
  description: string
  height: number | null
  exposure: BoulderExposureValue | null
  strollerAccessible: boolean
  photoBlurHash: string | null
  photoWidth: number | null
  photoHeight: number | null
  latitude: number | null
  longitude: number | null
  topoDrawing: TopoDrawing | null
  /** YouTube or Vimeo video URL (Story 5.7) */
  videoUrl: string | null

  /* ── Status ── */
  /** Moderation outcome (stubbed — always 'pending' until Epic 7). */
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  /** Sync queue status, same pattern as BoulderDraft (Story 5.5). */
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict' | 'error'

  createdAt: string
  updatedAt: string
}

/** Input for creating a suggestion (IDs, statuses, timestamps auto-generated). */
export type BoulderSuggestionInput = Omit<
  BoulderSuggestion,
  'id' | 'moderationStatus' | 'syncStatus' | 'createdAt' | 'updatedAt'
>

/** Updatable fields when editing an existing suggestion. */
export type BoulderSuggestionUpdate = Partial<
  Omit<BoulderSuggestion, 'id' | 'originalBoulderId' | 'originalSnapshot' | 'moderationStatus' | 'syncStatus' | 'createdAt' | 'updatedAt'>
>

interface SuggestionState {
  suggestions: BoulderSuggestion[]

  /** Create a new suggestion. Returns the generated ID. */
  addSuggestion: (data: BoulderSuggestionInput) => string

  /** Update an existing suggestion's proposed values. */
  updateSuggestion: (id: string, data: BoulderSuggestionUpdate) => void

  /** Remove a suggestion by ID. */
  removeSuggestion: (id: string) => void

  /** Retrieve a single suggestion by ID. */
  getSuggestion: (id: string) => BoulderSuggestion | undefined

  /** Get all suggestions targeting a specific boulder. */
  getSuggestionsForBoulder: (boulderId: string) => BoulderSuggestion[]

  /** Update sync status for a suggestion */
  setSyncStatus: (id: string, status: SyncStatus) => void

  /** Get all suggestions that need syncing */
  getUnsyncedSuggestions: () => BoulderSuggestion[]

  /** Update moderation status for a suggestion */
  setModerationStatus: (id: string, status: BoulderSuggestion['moderationStatus']) => void
}

/** Simple unique ID generator (same pattern as boulder-draft-store). */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set, get) => ({
      suggestions: [],

      addSuggestion: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const suggestion: BoulderSuggestion = {
          ...data,
          id,
          moderationStatus: 'pending',
          syncStatus: 'local',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ suggestions: [suggestion, ...state.suggestions] }))
        return id
      },

      updateSuggestion: (id, data) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id
              ? { ...s, ...data, updatedAt: new Date().toISOString() }
              : s
          ),
        }))
      },

      removeSuggestion: (id) => {
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.id !== id),
        }))
      },

      getSuggestion: (id) => {
        return get().suggestions.find((s) => s.id === id)
      },

      getSuggestionsForBoulder: (boulderId) => {
        return get().suggestions.filter(
          (s) => s.originalBoulderId === boulderId
        )
      },

      setSyncStatus: (id, status) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, syncStatus: status } : s
          ),
        }))
      },

      getUnsyncedSuggestions: () => {
        return get().suggestions.filter(
          (s) => s.syncStatus === 'local' || s.syncStatus === 'error'
        )
      },

      setModerationStatus: (id, status) => {
        set((state) => ({
          suggestions: state.suggestions.map((s) =>
            s.id === id ? { ...s, moderationStatus: status } : s
          ),
        }))
      },
    }),
    {
      name: 'bleau-boulder-suggestions',
    }
  )
)
