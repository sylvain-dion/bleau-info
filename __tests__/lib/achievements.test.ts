import { describe, it, expect } from 'vitest'
import {
  detectNewBadgeAchievements,
  detectNewStreakAchievements,
  detectNewGoalAchievements,
  STREAK_MILESTONES,
} from '@/lib/achievements'
import { computeBadges } from '@/lib/badges'
import type { Goal } from '@/lib/goals'

const NOW = new Date('2026-04-28T10:00:00Z')

const STARTER_BADGES = computeBadges({
  tickCount: 1,
  uniqueBoulders: 1,
  maxGrade: '5a',
  sectorsVisited: 1,
  circuitsCompleted: 0,
})

describe('detectNewBadgeAchievements', () => {
  it('returns no events when nothing is earned', () => {
    const empty = computeBadges({
      tickCount: 0,
      uniqueBoulders: 0,
      maxGrade: '',
      sectorsVisited: 0,
      circuitsCompleted: 0,
    })
    expect(detectNewBadgeAchievements(empty, [], NOW)).toHaveLength(0)
  })

  it('emits one event per newly-earned badge', () => {
    const events = detectNewBadgeAchievements(STARTER_BADGES, [], NOW)
    // Premier Bloc + 5e degré at minimum
    const ids = events.map((e) => e.id)
    expect(ids).toContain('badge:volume-1')
    expect(ids).toContain('badge:grade-5')
  })

  it('skips badges already in the seen set', () => {
    const events = detectNewBadgeAchievements(
      STARTER_BADGES,
      ['volume-1', 'grade-5'],
      NOW,
    )
    expect(events.find((e) => e.id === 'badge:volume-1')).toBeUndefined()
    expect(events.find((e) => e.id === 'badge:grade-5')).toBeUndefined()
  })

  it('skips locked badges', () => {
    const events = detectNewBadgeAchievements(STARTER_BADGES, [], NOW)
    // 'volume-100' (Centurion) requires 100 ticks → not earned at tickCount=1
    expect(events.find((e) => e.id === 'badge:volume-100')).toBeUndefined()
  })

  it('marks every event with the supplied timestamp', () => {
    const events = detectNewBadgeAchievements(STARTER_BADGES, [], NOW)
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) {
      expect(e.earnedAt).toBe(NOW.toISOString())
      expect(e.kind).toBe('badge')
    }
  })
})

describe('detectNewStreakAchievements', () => {
  it('emits no events when below the lowest milestone', () => {
    expect(detectNewStreakAchievements(2, [], NOW)).toHaveLength(0)
  })

  it('emits exactly one event when crossing a single milestone', () => {
    const events = detectNewStreakAchievements(3, [], NOW)
    expect(events).toHaveLength(1)
    expect(events[0].id).toBe('streak:3')
  })

  it('emits all crossed milestones if none were seen', () => {
    const events = detectNewStreakAchievements(15, [], NOW)
    const ids = events.map((e) => e.id)
    expect(ids).toEqual(['streak:3', 'streak:7', 'streak:14'])
  })

  it('skips milestones already in the seen set', () => {
    const events = detectNewStreakAchievements(7, [3], NOW)
    expect(events.map((e) => e.id)).toEqual(['streak:7'])
  })

  it('escalates the title at higher tiers', () => {
    const big = detectNewStreakAchievements(365, [], NOW)
    const top = big.find((e) => e.id === 'streak:365')
    expect(top?.title).toMatch(/année/i)
  })

  it('exposes the same milestones as STREAK_MILESTONES', () => {
    expect(STREAK_MILESTONES.length).toBeGreaterThan(0)
    // Sanity: ascending and unique
    const sorted = [...STREAK_MILESTONES].sort((a, b) => a - b)
    expect(sorted).toEqual([...STREAK_MILESTONES])
    expect(new Set(STREAK_MILESTONES).size).toBe(STREAK_MILESTONES.length)
  })
})

describe('detectNewGoalAchievements', () => {
  function makeGoal(partial: Partial<Goal>): Goal {
    return {
      id: 'g1',
      type: 'tickCount',
      target: 50,
      deadline: null,
      createdAt: '2026-01-01T00:00:00Z',
      achievedAt: '2026-04-28T09:00:00Z',
      ...partial,
    }
  }

  it('emits one event for each newly-achieved id', () => {
    const goals = [makeGoal({ id: 'a' }), makeGoal({ id: 'b' })]
    const events = detectNewGoalAchievements(['a', 'b'], goals, [], NOW)
    expect(events).toHaveLength(2)
    expect(events.map((e) => e.id)).toEqual(['goal:a', 'goal:b'])
  })

  it('skips goals already in the seen set', () => {
    const goals = [makeGoal({ id: 'a' })]
    const events = detectNewGoalAchievements(['a'], goals, ['a'], NOW)
    expect(events).toHaveLength(0)
  })

  it('silently drops ids that no longer exist (stale store input)', () => {
    const goals = [makeGoal({ id: 'a' })]
    const events = detectNewGoalAchievements(['a', 'ghost'], goals, [], NOW)
    expect(events.map((e) => e.id)).toEqual(['goal:a'])
  })

  it('formats grade goals using the canonical scale', () => {
    const goals = [makeGoal({ id: 'g', type: 'maxGrade', target: '7a' })]
    const events = detectNewGoalAchievements(['g'], goals, [], NOW)
    expect(events[0].subtitle).toMatch(/7A/)
  })

  it('formats numeric goals with the unit', () => {
    const goals = [
      makeGoal({ id: 'g', type: 'sectorsVisited', target: 6 }),
    ]
    const events = detectNewGoalAchievements(['g'], goals, [], NOW)
    expect(events[0].subtitle).toMatch(/6 secteurs/)
  })
})
