/**
 * Story 15.1 — Spoiler preference store.
 *
 * Tracks which beta-flagged comments / videos the current user has chosen
 * to reveal, plus per-boulder "reveal everything" overrides.
 *
 * Persisted in localStorage so a user who already saw the beta on a
 * boulder doesn't have to re-confirm on every visit.
 *
 * Design choices:
 *  - Maps of `id → true` (instead of `Set`) so JSON serialisation by
 *    `zustand/persist` round-trips correctly.
 *  - Reveal is one-way: there's no "hide it again" UI. If the user
 *    wants to forget, the global "Tout masquer" toggle on the comment
 *    section clears the per-boulder revealed entries below it.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SpoilerPreferenceState {
  /** commentId → true once revealed. */
  revealedComments: Record<string, true>
  /** Stable video key (URL) → true once revealed. */
  revealedVideos: Record<string, true>
  /** boulderId → true when the user toggled "tout afficher". */
  revealAllByBoulder: Record<string, true>

  /** Mark a single comment as revealed. */
  revealComment: (commentId: string) => void
  /** Mark a single video (keyed by URL) as revealed. */
  revealVideo: (videoKey: string) => void
  /** Toggle the per-boulder "show all beta" override. */
  setRevealAll: (boulderId: string, value: boolean) => void

  /** Per-comment query: revealed individually OR via boulder override. */
  isCommentRevealed: (commentId: string, boulderId: string) => boolean
  /** Per-video query: revealed individually OR via boulder override. */
  isVideoRevealed: (videoKey: string, boulderId: string) => boolean
  /** Per-boulder query for the global toggle. */
  isRevealAllForBoulder: (boulderId: string) => boolean

  /**
   * Clear every reveal under a boulder — both individual comments/videos
   * and the boulder-level override. Used by the "Tout masquer" affordance
   * in the comment section header.
   */
  hideAllForBoulder: (
    boulderId: string,
    options: { commentIds: readonly string[]; videoKeys: readonly string[] },
  ) => void
}

export const useSpoilerPreferenceStore = create<SpoilerPreferenceState>()(
  persist(
    (set, get) => ({
      revealedComments: {},
      revealedVideos: {},
      revealAllByBoulder: {},

      revealComment: (commentId) =>
        set((state) =>
          state.revealedComments[commentId]
            ? state
            : {
                ...state,
                revealedComments: {
                  ...state.revealedComments,
                  [commentId]: true,
                },
              },
        ),

      revealVideo: (videoKey) =>
        set((state) =>
          state.revealedVideos[videoKey]
            ? state
            : {
                ...state,
                revealedVideos: { ...state.revealedVideos, [videoKey]: true },
              },
        ),

      setRevealAll: (boulderId, value) =>
        set((state) => {
          const next = { ...state.revealAllByBoulder }
          if (value) next[boulderId] = true
          else delete next[boulderId]
          return { ...state, revealAllByBoulder: next }
        }),

      isCommentRevealed: (commentId, boulderId) => {
        const s = get()
        return Boolean(
          s.revealedComments[commentId] || s.revealAllByBoulder[boulderId],
        )
      },

      isVideoRevealed: (videoKey, boulderId) => {
        const s = get()
        return Boolean(
          s.revealedVideos[videoKey] || s.revealAllByBoulder[boulderId],
        )
      },

      isRevealAllForBoulder: (boulderId) =>
        Boolean(get().revealAllByBoulder[boulderId]),

      hideAllForBoulder: (boulderId, { commentIds, videoKeys }) =>
        set((state) => {
          const comments = { ...state.revealedComments }
          for (const id of commentIds) delete comments[id]
          const videos = { ...state.revealedVideos }
          for (const key of videoKeys) delete videos[key]
          const overrides = { ...state.revealAllByBoulder }
          delete overrides[boulderId]
          return {
            ...state,
            revealedComments: comments,
            revealedVideos: videos,
            revealAllByBoulder: overrides,
          }
        }),
    }),
    { name: 'bleau-spoiler-preferences' },
  ),
)
