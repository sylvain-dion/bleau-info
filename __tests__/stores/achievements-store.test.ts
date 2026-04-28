import { describe, it, expect, beforeEach } from 'vitest'
import { useAchievementsStore } from '@/stores/achievements-store'
import type { AchievementEvent } from '@/lib/achievements'

function reset() {
  useAchievementsStore.setState({
    seenBadgeIds: [],
    seenStreakMilestones: [],
    seenGoalIds: [],
    log: [],
    queue: [],
  })
}

function event(partial: Partial<AchievementEvent> & Pick<AchievementEvent, 'id' | 'kind'>): AchievementEvent {
  return {
    title: 'Title',
    subtitle: 'Subtitle',
    icon: 'Trophy',
    color: 'text-amber-500',
    earnedAt: '2026-04-28T10:00:00Z',
    ...partial,
  } as AchievementEvent
}

describe('useAchievementsStore', () => {
  beforeEach(() => reset())

  it('starts empty on every dimension', () => {
    const s = useAchievementsStore.getState()
    expect(s.seenBadgeIds).toEqual([])
    expect(s.seenStreakMilestones).toEqual([])
    expect(s.seenGoalIds).toEqual([])
    expect(s.log).toEqual([])
    expect(s.queue).toEqual([])
  })

  it('enqueueAchievements appends to queue + log and marks badges as seen', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:volume-1', kind: 'badge' }),
      event({ id: 'streak:7', kind: 'streak' }),
      event({ id: 'goal:abc', kind: 'goal' }),
    ])
    const s = useAchievementsStore.getState()
    expect(s.queue).toHaveLength(3)
    expect(s.log).toHaveLength(3)
    expect(s.seenBadgeIds).toEqual(['volume-1'])
    expect(s.seenStreakMilestones).toEqual([7])
    expect(s.seenGoalIds).toEqual(['abc'])
  })

  it('dedupes events with the same id within a single call', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:x', kind: 'badge' }),
      event({ id: 'badge:x', kind: 'badge' }),
    ])
    expect(useAchievementsStore.getState().queue).toHaveLength(1)
    expect(useAchievementsStore.getState().log).toHaveLength(1)
  })

  it('does not duplicate seen ids across calls', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:volume-1', kind: 'badge' }),
    ])
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:volume-1', kind: 'badge' }),
    ])
    expect(useAchievementsStore.getState().seenBadgeIds).toEqual(['volume-1'])
  })

  it('truncates the log at 30 entries (keeps newest)', () => {
    const events: AchievementEvent[] = []
    for (let i = 0; i < 35; i++) {
      events.push(event({ id: `badge:b${i}`, kind: 'badge', title: `B${i}` }))
    }
    useAchievementsStore.getState().enqueueAchievements(events)
    const log = useAchievementsStore.getState().log
    expect(log).toHaveLength(30)
    // The most recent batch is reversed before being prepended, so the very
    // first event added in the batch ends up at index 29 of the log.
    expect(log[0].id).toBe('badge:b34')
  })

  it('shiftQueue returns and removes the head', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:a', kind: 'badge' }),
      event({ id: 'badge:b', kind: 'badge' }),
    ])
    const head = useAchievementsStore.getState().shiftQueue()
    expect(head?.id).toBe('badge:a')
    expect(useAchievementsStore.getState().queue).toHaveLength(1)
  })

  it('shiftQueue returns null when empty', () => {
    expect(useAchievementsStore.getState().shiftQueue()).toBe(null)
  })

  it('clearQueue empties the queue but preserves seen + log', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:a', kind: 'badge' }),
    ])
    useAchievementsStore.getState().clearQueue()
    const s = useAchievementsStore.getState()
    expect(s.queue).toHaveLength(0)
    expect(s.log).toHaveLength(1)
    expect(s.seenBadgeIds).toEqual(['a'])
  })

  it('clear wipes everything', () => {
    useAchievementsStore.getState().enqueueAchievements([
      event({ id: 'badge:a', kind: 'badge' }),
    ])
    useAchievementsStore.getState().clear()
    const s = useAchievementsStore.getState()
    expect(s.seenBadgeIds).toEqual([])
    expect(s.log).toEqual([])
    expect(s.queue).toEqual([])
  })
})
