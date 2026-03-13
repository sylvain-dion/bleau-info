import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoulderStyleValue, BoulderExposureValue } from '@/lib/validations/boulder'
import { mockBoulders } from '@/lib/data/mock-boulders'

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
  status: 'draft' | 'pending'
  createdAt: string
  updatedAt: string
}

/** Input for creating a new draft (IDs and timestamps auto-generated). */
export type BoulderDraftInput = Omit<
  BoulderDraft,
  'id' | 'status' | 'createdAt' | 'updatedAt'
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
          id,
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
