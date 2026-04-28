/**
 * Achievement notification store (Story 14.4).
 *
 * Holds three things:
 *  1. `seenBadgeIds` — badge ids the user has already been celebrated for
 *  2. `seenStreakMilestones` — streak day-counts already celebrated
 *  3. `seenGoalIds` — goal ids already celebrated
 *  4. `log` — last 30 achievement events (for the profile log)
 *  5. `queue` — events waiting to be shown by the celebration overlay
 *
 * The queue is non-persisted (ephemeral). The seen sets + log are
 * persisted so we don't re-celebrate badges across page reloads.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AchievementEvent } from '@/lib/achievements'

const MAX_LOG_SIZE = 30

interface AchievementsState {
  seenBadgeIds: string[]
  seenStreakMilestones: number[]
  seenGoalIds: string[]
  /** Persisted history of achievements, newest first. */
  log: AchievementEvent[]
  /** Ephemeral FIFO queue read by the celebration overlay. */
  queue: AchievementEvent[]

  /**
   * Append events to the queue + log and mark each as seen so they
   * won't fire again on the next reconciliation pass. Idempotent on
   * duplicate event ids within the same call.
   */
  enqueueAchievements: (events: readonly AchievementEvent[]) => void

  /** Pop the head of the queue. Used by the overlay after dismiss. */
  shiftQueue: () => AchievementEvent | null

  /** Clear the queue without dismissing each one (used on signout). */
  clearQueue: () => void

  /** Wipe all state (hard reset). */
  clear: () => void
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      seenBadgeIds: [],
      seenStreakMilestones: [],
      seenGoalIds: [],
      log: [],
      queue: [],

      enqueueAchievements: (events) => {
        if (events.length === 0) return

        // Dedupe within this batch by id.
        const incoming: AchievementEvent[] = []
        const incomingIds = new Set<string>()
        for (const e of events) {
          if (incomingIds.has(e.id)) continue
          incomingIds.add(e.id)
          incoming.push(e)
        }

        const newBadgeIds: string[] = []
        const newStreakMilestones: number[] = []
        const newGoalIds: string[] = []

        for (const e of incoming) {
          if (e.kind === 'badge') {
            newBadgeIds.push(e.id.replace(/^badge:/, ''))
          } else if (e.kind === 'streak') {
            const n = Number(e.id.replace(/^streak:/, ''))
            if (Number.isFinite(n)) newStreakMilestones.push(n)
          } else if (e.kind === 'goal') {
            newGoalIds.push(e.id.replace(/^goal:/, ''))
          }
        }

        set((state) => ({
          queue: [...state.queue, ...incoming],
          log: [...incoming.slice().reverse(), ...state.log].slice(0, MAX_LOG_SIZE),
          seenBadgeIds: dedupeStrings([...state.seenBadgeIds, ...newBadgeIds]),
          seenStreakMilestones: dedupeNumbers([
            ...state.seenStreakMilestones,
            ...newStreakMilestones,
          ]),
          seenGoalIds: dedupeStrings([...state.seenGoalIds, ...newGoalIds]),
        }))
      },

      shiftQueue: () => {
        const { queue } = get()
        if (queue.length === 0) return null
        const [head, ...rest] = queue
        set({ queue: rest })
        return head
      },

      clearQueue: () => set({ queue: [] }),

      clear: () =>
        set({
          seenBadgeIds: [],
          seenStreakMilestones: [],
          seenGoalIds: [],
          log: [],
          queue: [],
        }),
    }),
    {
      name: 'bleau-achievements',
      storage: createJSONStorage(() => localStorage),
      // Don't persist the ephemeral queue.
      partialize: (state) => ({
        seenBadgeIds: state.seenBadgeIds,
        seenStreakMilestones: state.seenStreakMilestones,
        seenGoalIds: state.seenGoalIds,
        log: state.log,
      }),
    },
  ),
)

function dedupeStrings(arr: readonly string[]): string[] {
  return Array.from(new Set(arr))
}
function dedupeNumbers(arr: readonly number[]): number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b)
}
