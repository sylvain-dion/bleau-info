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

import { useEffect, useRef } from 'react'
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
 * Re-runs whenever ticks, circuit completions, or goals change.
 * Skips the very first run if there are no ticks at all (new users
 * shouldn't get a wave of "first day" celebrations from seeded data).
 */
export function useAchievementWatcher(): void {
  const ticks = useTickStore((s) => s.ticks)
  const completions = useCircuitCompletionStore((s) => s.completions)
  const goals = useGoalsStore((s) => s.goals)
  const reconcileGoals = useGoalsStore((s) => s.reconcileAchievements)

  const seenBadgeIds = useAchievementsStore((s) => s.seenBadgeIds)
  const seenStreakMilestones = useAchievementsStore(
    (s) => s.seenStreakMilestones,
  )
  const seenGoalIds = useAchievementsStore((s) => s.seenGoalIds)
  const enqueue = useAchievementsStore((s) => s.enqueueAchievements)

  // Refs avoid re-firing the effect when the store version of seen
  // sets ticks (it grows from inside the effect itself).
  const seenBadgesRef = useRef(seenBadgeIds)
  const seenStreaksRef = useRef(seenStreakMilestones)
  const seenGoalsRef = useRef(seenGoalIds)
  seenBadgesRef.current = seenBadgeIds
  seenStreaksRef.current = seenStreakMilestones
  seenGoalsRef.current = seenGoalIds

  useEffect(() => {
    if (ticks.length === 0) return

    const input = deriveBadgeInputFromTicks(ticks, completions)
    const badges = computeBadges(input)

    const badgeEvents = detectNewBadgeAchievements(
      badges,
      seenBadgesRef.current,
    )
    const streakEvents = detectNewStreakAchievements(
      input.longestStreak ?? 0,
      seenStreaksRef.current,
    )

    // Goals: ask the goals store to mark anything that just crossed
    // the line, then turn that id list into rich events.
    const newlyAchievedGoalIds = reconcileGoals(input)
    const goalEvents = detectNewGoalAchievements(
      newlyAchievedGoalIds,
      goals,
      seenGoalsRef.current,
    )

    const all: AchievementEvent[] = [
      ...badgeEvents,
      ...streakEvents,
      ...goalEvents,
    ]
    if (all.length > 0) enqueue(all)
  }, [ticks, completions, goals, enqueue, reconcileGoals])
}
