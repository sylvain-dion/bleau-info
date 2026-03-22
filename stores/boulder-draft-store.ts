import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoulderStyleValue, BoulderExposureValue } from '@/lib/validations/boulder'
import { mockBoulders } from '@/lib/data/mock-boulders'
import type { TopoDrawing } from '@/lib/data/mock-topos'
import type { SyncStatus } from '@/lib/sync/types'

/** A locally-stored boulder draft awaiting sync / moderation. */
export interface BoulderDraft {
  id: string
  name: string
  grade: string
  style: BoulderStyleValue
  sector: string
  description: string
  height: number | null
  exposure: BoulderExposureValue | null
  strollerAccessible: boolean
  /** BlurHash placeholder for the photo (Story 5.2) */
  photoBlurHash: string | null
  /** Photo width in pixels after resize */
  photoWidth: number | null
  /** Photo height in pixels after resize */
  photoHeight: number | null
  /** GPS latitude (6 decimal places, ~11cm precision) */
  latitude: number | null
  /** GPS longitude (6 decimal places, ~11cm precision) */
  longitude: number | null
  /** Vector topo drawing data (Story 5.4) */
  topoDrawing: TopoDrawing | null
  /** YouTube or Vimeo video URL (Story 5.7) */
  videoUrl: string | null
  /** Flagged as potential duplicate during creation (Story 7.1) */
  potentialDuplicate: boolean
  /** Sync status for offline/online queue (Story 5.5) */
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict' | 'error'
  status: 'draft' | 'pending'
  createdAt: string
  updatedAt: string
}

/** Input for creating a new draft (IDs, timestamps, syncStatus auto-generated). */
export type BoulderDraftInput = Omit<
  BoulderDraft,
  'id' | 'status' | 'syncStatus' | 'createdAt' | 'updatedAt'
>

interface BoulderDraftState {
  drafts: BoulderDraft[]

  /** Save a new boulder draft. Returns the generated ID. */
  addDraft: (data: BoulderDraftInput) => string

  /** Update an existing draft by ID. */
  updateDraft: (id: string, data: Partial<BoulderDraftInput>) => void

  /** Remove a draft by ID. */
  removeDraft: (id: string) => void

  /** Retrieve a single draft by ID. */
  getDraft: (id: string) => BoulderDraft | undefined

  /**
   * Check if a boulder name already exists in the given sector.
   * Checks both mock data and local drafts for soft uniqueness.
   */
  isNameTaken: (name: string, sector: string) => boolean

  /** Update sync status for a draft */
  setSyncStatus: (draftId: string, status: SyncStatus) => void

  /** Get all drafts that need syncing */
  getUnsyncedDrafts: () => BoulderDraft[]
}

/** Simple unique ID generator (same pattern as tick-store). */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useBoulderDraftStore = create<BoulderDraftState>()(
  persist(
    (set, get) => ({
      drafts: [],

      addDraft: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const draft: BoulderDraft = {
          ...data,
          photoBlurHash: data.photoBlurHash ?? null,
          photoWidth: data.photoWidth ?? null,
          photoHeight: data.photoHeight ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          topoDrawing: data.topoDrawing ?? null,
          videoUrl: data.videoUrl ?? null,
          potentialDuplicate: data.potentialDuplicate ?? false,
          id,
          syncStatus: 'local',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ drafts: [draft, ...state.drafts] }))
        return id
      },

      updateDraft: (id, data) => {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id
              ? { ...d, ...data, updatedAt: new Date().toISOString() }
              : d
          ),
        }))
      },

      removeDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
        }))
      },

      getDraft: (id) => {
        return get().drafts.find((d) => d.id === id)
      },

      setSyncStatus: (draftId, status) => {
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === draftId ? { ...d, syncStatus: status } : d
          ),
        }))
      },

      getUnsyncedDrafts: () => {
        return get().drafts.filter(
          (d) => d.syncStatus === 'local' || d.syncStatus === 'error'
        )
      },

      isNameTaken: (name, sector) => {
        if (!name || !sector) return false

        const lower = name.toLowerCase().trim()

        // Check mock boulders
        const inMock = mockBoulders.features.some(
          (f) =>
            f.properties.name.toLowerCase() === lower &&
            f.properties.sector === sector
        )
        if (inMock) return true

        // Check local drafts
        return get().drafts.some(
          (d) =>
            d.name.toLowerCase().trim() === lower &&
            d.sector === sector
        )
      },
    }),
    {
      name: 'bleau-boulder-drafts',
    }
  )
)
