import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncStatus } from '@/lib/sync/types'

/** A user-submitted video for a boulder. */
export interface VideoSubmission {
  id: string
  boulderId: string
  videoUrl: string
  climberName: string | null
  videographerName: string | null
  /**
   * Story 15.1 — uploader tagged this video as containing the climbing beta.
   * Optional for backward-compat with previously persisted submissions.
   */
  containsBeta?: boolean
  moderationStatus: 'pending' | 'approved' | 'rejected'
  /** Sync queue status (Story 6.2) */
  syncStatus: SyncStatus
  /**
   * Soft-delete flag — Story 5.8.
   *
   * When set, the video stays visible (because it's already public)
   * but the contributions hub shows a "Suppression en attente" badge
   * and the moderation queue will pick it up on next sync.
   */
  pendingDeletion?: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

/** Fields required when creating a new submission. */
export type VideoSubmissionInput = Pick<
  VideoSubmission,
  'boulderId' | 'videoUrl' | 'userId'
> & {
  climberName?: string | null
  videographerName?: string | null
  containsBeta?: boolean
}

/** Updatable fields when editing an existing submission. */
export type VideoSubmissionUpdate = Partial<
  Pick<
    VideoSubmission,
    'videoUrl' | 'climberName' | 'videographerName' | 'containsBeta'
  >
>

interface VideoSubmissionState {
  submissions: VideoSubmission[]

  /** Create a new video submission. Returns the generated ID. */
  addSubmission: (data: VideoSubmissionInput) => string

  /** Update an existing submission's editable fields. */
  updateSubmission: (id: string, data: VideoSubmissionUpdate) => void

  /** Remove a submission by ID. */
  removeSubmission: (id: string) => void

  /** Get a single submission by ID. */
  getSubmission: (id: string) => VideoSubmission | undefined

  /** Get all submissions targeting a specific boulder. */
  getSubmissionsForBoulder: (boulderId: string) => VideoSubmission[]

  /** Get all submissions by a specific user. */
  getSubmissionsForUser: (userId: string) => VideoSubmission[]

  /** Get unique climber names across all submissions (for autocomplete). */
  getUniqueClimberNames: () => string[]

  /** Get unique videographer names across all submissions (for autocomplete). */
  getUniqueVideographerNames: () => string[]

  /** Update sync status for a submission */
  setSyncStatus: (id: string, status: SyncStatus) => void

  /** Get all submissions that need syncing */
  getUnsyncedSubmissions: () => VideoSubmission[]

  /**
   * Soft-delete a video submission (Story 5.8).
   *
   * - `pending` / `rejected` videos: removed immediately.
   * - `approved` videos: flagged with `pendingDeletion: true`; the
   *   moderator queue picks it up on next sync.
   */
  requestDeletion: (id: string) => 'removed' | 'pending' | 'noop'
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useVideoSubmissionStore = create<VideoSubmissionState>()(
  persist(
    (set, get) => ({
      submissions: [],

      addSubmission: (data) => {
        const id = generateId()
        const now = new Date().toISOString()
        const submission: VideoSubmission = {
          id,
          boulderId: data.boulderId,
          videoUrl: data.videoUrl,
          climberName: data.climberName ?? null,
          videographerName: data.videographerName ?? null,
          containsBeta: data.containsBeta ?? false,
          moderationStatus: 'pending',
          syncStatus: 'local',
          userId: data.userId,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          submissions: [submission, ...state.submissions],
        }))
        return id
      },

      updateSubmission: (id, data) => {
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id
              ? { ...s, ...data, updatedAt: new Date().toISOString() }
              : s
          ),
        }))
      },

      removeSubmission: (id) => {
        set((state) => ({
          submissions: state.submissions.filter((s) => s.id !== id),
        }))
      },

      getSubmission: (id) => {
        return get().submissions.find((s) => s.id === id)
      },

      getSubmissionsForBoulder: (boulderId) => {
        return get().submissions.filter((s) => s.boulderId === boulderId)
      },

      getSubmissionsForUser: (userId) => {
        return get().submissions.filter((s) => s.userId === userId)
      },

      getUniqueClimberNames: () => {
        const names = new Set<string>()
        for (const s of get().submissions) {
          if (s.climberName) names.add(s.climberName)
        }
        return Array.from(names).sort()
      },

      getUniqueVideographerNames: () => {
        const names = new Set<string>()
        for (const s of get().submissions) {
          if (s.videographerName) names.add(s.videographerName)
        }
        return Array.from(names).sort()
      },

      setSyncStatus: (id, status) => {
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, syncStatus: status } : s
          ),
        }))
      },

      getUnsyncedSubmissions: () => {
        return get().submissions.filter(
          (s) => s.syncStatus === 'local' || s.syncStatus === 'error'
        )
      },

      requestDeletion: (id) => {
        const sub = get().submissions.find((s) => s.id === id)
        if (!sub) return 'noop'
        if (sub.moderationStatus === 'approved') {
          if (sub.pendingDeletion) return 'pending'
          set((state) => ({
            submissions: state.submissions.map((s) =>
              s.id === id
                ? { ...s, pendingDeletion: true, updatedAt: new Date().toISOString() }
                : s,
            ),
          }))
          return 'pending'
        }
        set((state) => ({
          submissions: state.submissions.filter((s) => s.id !== id),
        }))
        return 'removed'
      },
    }),
    {
      name: 'bleau-video-submissions',
    }
  )
)
