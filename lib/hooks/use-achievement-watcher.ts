'use client'

/**
 * Achievement watcher (Story 14.4).
 *
 * Mounted on the authenticated profile page. Watches the tick store +
 * circuit completion store + goals store and dispatches new
 * `AchievementEvent`s to the achievements store whenever the user
 * unlocks a badge, crosses a streak milestone, or achieves a goal.
 *
 * The hook does not render anything. It just bridges the
 * "what the user has" world (badges/streaks/goals) and the
 * "what we've already celebrated" world (achievements store).
 */

import { useEffect } from 'react'
import { useTickStore } from '@/stores/tick-store'
import { useCircuitCompletionStore } from '@/stores/circuit-completion-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useAchievementsStore } from '@/stores/achievements-store'
import {
  computeBadges,
  deriveBadgeInputFromTicks,
} from '@/lib/badges'
import {
  detectNewBadgeAchievements,
  detectNewGoalAchievements,
  detectNewStreakAchievements,
  type AchievementEvent,
} from '@/lib/achievements'

/**
 * Mount once on the authenticated profile page.
 *
 * Re-runs only when raw ticks or circuit completions change. We
 * intentionally do NOT depend on `goals` or any of the achievements
 * store's seen-sets — those are read via `getState()` inside the
 * effect to avoid feedback loops (the effect itself mutates them).
 *
 * Skips when there are no ticks so new users don't get a wave of
 * "first day" celebrations from seeded data.
 */
export function useAchievementWatcher(): void {
  const ticks = useTickStore((s) => s.ticks)
  const completions = useCircuitCompletionStore((s) => s.completions)

  useEffect(() => {
    if (ticks.length === 0) return

    const input = deriveBadgeInputFromTicks(ticks, completions)
    const badges = computeBadges(input)

    const achievementsState = useAchievementsStore.getState()
    const badgeEvents = detectNewBadgeAchievements(
      badges,
      achievementsState.seenBadgeIds,
    )
    const streakEvents = detectNewStreakAchievements(
      input.longestStreak ?? 0,
      achievementsState.seenStreakMilestones,
    )

    // Goals: ask the goals store to mark anything that just crossed
    // the line, then turn that id list into rich events.
    const goalsState = useGoalsStore.getState()
    const newlyAchievedGoalIds = goalsState.reconcileAchievements(input)
    const goalEvents = detectNewGoalAchievements(
      newlyAchievedGoalIds,
      // Read fresh after reconcile so achievedAt timestamps are
      // visible to the lookup map inside the detector.
      useGoalsStore.getState().goals,
      achievementsState.seenGoalIds,
    )

    const all: AchievementEvent[] = [
      ...badgeEvents,
      ...streakEvents,
      ...goalEvents,
    ]
    if (all.length > 0) achievementsState.enqueueAchievements(all)
  }, [ticks, completions])
}
