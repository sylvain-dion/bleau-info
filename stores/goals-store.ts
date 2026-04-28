/**
 * Personal climbing goals (Story 14.3).
 *
 * Local-first Zustand store with persist. Goals are user-set targets
 * checked against the same `BadgeInput` shape used by the badge system.
 *
 * The store is intentionally dumb — progress computation lives in
 * `lib/goals.ts`. The store only persists the list of goals and the
 * `achievedAt` timestamp once a goal crosses the line.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  computeGoalProgress,
  type Goal,
  type GoalType,
} from '@/lib/goals'
import type { BadgeInput } from '@/lib/badges'

interface GoalsState {
  goals: Goal[]

  /** Add a new goal. Returns the created goal. */
  addGoal: (params: {
    type: GoalType
    target: number | string
    deadline?: string | null
  }) => Goal

  /** Remove a goal by id. */
  removeGoal: (id: string) => void

  /** Update a goal's deadline (or clear it by passing null). */
  updateDeadline: (id: string, deadline: string | null) => void

  /**
   * Re-evaluate all goals against the current stats. Goals that
   * cross the threshold get an `achievedAt` timestamp. Returns the
   * ids of goals that were *newly* achieved by this call (so the UI
   * can celebrate them).
   */
  reconcileAchievements: (input: BadgeInput) => string[]

  /** Clear every goal (used by hard-reset / logout). */
  clear: () => void
}

function generateId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: ({ type, target, deadline = null }) => {
        const goal: Goal = {
          id: generateId(),
          type,
          target,
          deadline,
          createdAt: new Date().toISOString(),
          achievedAt: null,
        }
        set((state) => ({ goals: [...state.goals, goal] }))
        return goal
      },

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      updateDeadline: (id, deadline) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, deadline } : g,
          ),
        })),

      reconcileAchievements: (input) => {
        const now = new Date().toISOString()
        const newlyAchieved: string[] = []
        const current = get().goals

        // First pass: find newly-achieved ids without mutating state.
        for (const g of current) {
          if (g.achievedAt) continue
          if (computeGoalProgress(g, input).isAchieved) {
            newlyAchieved.push(g.id)
          }
        }

        // Skip the write entirely when nothing crossed the line —
        // returning a new array reference here would cascade re-renders
        // and feed the achievement watcher's effect into an infinite loop.
        if (newlyAchieved.length === 0) return newlyAchieved

        const achieved = new Set(newlyAchieved)
        set((state) => ({
          goals: state.goals.map((g) =>
            achieved.has(g.id) ? { ...g, achievedAt: now } : g,
          ),
        }))

        return newlyAchieved
      },

      clear: () => set({ goals: [] }),
    }),
    { name: 'bleau-goals' },
  ),
)

// Re-export types for convenience.
export type { Goal, GoalType }
