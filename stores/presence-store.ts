/**
 * Zustand store for mock moderator presence.
 *
 * Tracks which moderators are online and which queue items
 * they're currently reviewing. In production, this would use
 * Supabase Realtime Presence channels.
 */

import { create } from 'zustand'

export interface ModeratorPresence {
  /** Unique moderator ID */
  moderatorId: string
  /** Display name */
  name: string
  /** Queue item ID being reviewed (null = browsing) */
  reviewingItemId: string | null
  /** Last activity timestamp */
  lastSeen: string
}

interface PresenceState {
  /** All online moderators (including self) */
  moderators: ModeratorPresence[]

  /** Register the current moderator as online */
  joinSession: (moderatorId: string, name: string) => void

  /** Remove the current moderator */
  leaveSession: (moderatorId: string) => void

  /** Mark a moderator as reviewing a specific item */
  startReviewing: (moderatorId: string, itemId: string) => void

  /** Clear the reviewing state */
  stopReviewing: (moderatorId: string) => void

  /** Get who is reviewing a specific item (excluding self) */
  getReviewerForItem: (
    itemId: string,
    excludeId?: string
  ) => ModeratorPresence | null

  /** Get count of active moderators */
  getActiveCount: () => number

  /** Simulate another moderator joining (for testing) */
  simulateOtherModerator: (name: string, reviewingItemId?: string) => void
}

function generateId(): string {
  return `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  moderators: [],

  joinSession(moderatorId, name) {
    set((state) => {
      const existing = state.moderators.find(
        (m) => m.moderatorId === moderatorId
      )
      if (existing) {
        return {
          moderators: state.moderators.map((m) =>
            m.moderatorId === moderatorId
              ? { ...m, lastSeen: new Date().toISOString() }
              : m
          ),
        }
      }
      return {
        moderators: [
          ...state.moderators,
          {
            moderatorId,
            name,
            reviewingItemId: null,
            lastSeen: new Date().toISOString(),
          },
        ],
      }
    })
  },

  leaveSession(moderatorId) {
    set((state) => ({
      moderators: state.moderators.filter(
        (m) => m.moderatorId !== moderatorId
      ),
    }))
  },

  startReviewing(moderatorId, itemId) {
    set((state) => ({
      moderators: state.moderators.map((m) =>
        m.moderatorId === moderatorId
          ? {
              ...m,
              reviewingItemId: itemId,
              lastSeen: new Date().toISOString(),
            }
          : m
      ),
    }))
  },

  stopReviewing(moderatorId) {
    set((state) => ({
      moderators: state.moderators.map((m) =>
        m.moderatorId === moderatorId
          ? {
              ...m,
              reviewingItemId: null,
              lastSeen: new Date().toISOString(),
            }
          : m
      ),
    }))
  },

  getReviewerForItem(itemId, excludeId) {
    return (
      get().moderators.find(
        (m) => m.reviewingItemId === itemId && m.moderatorId !== excludeId
      ) ?? null
    )
  },

  getActiveCount() {
    return get().moderators.length
  },

  simulateOtherModerator(name, reviewingItemId) {
    const id = generateId()
    set((state) => ({
      moderators: [
        ...state.moderators,
        {
          moderatorId: id,
          name,
          reviewingItemId: reviewingItemId ?? null,
          lastSeen: new Date().toISOString(),
        },
      ],
    }))
  },
}))
