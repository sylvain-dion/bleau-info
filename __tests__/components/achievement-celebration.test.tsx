import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { AchievementCelebration } from '@/components/achievements/achievement-celebration'
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

function event(
  partial: Partial<AchievementEvent> &
    Pick<AchievementEvent, 'id' | 'kind' | 'title'>,
): AchievementEvent {
  return {
    subtitle: 'Subtitle',
    icon: 'Trophy',
    color: 'text-amber-500',
    earnedAt: '2026-04-28T10:00:00Z',
    ...partial,
  } as AchievementEvent
}

describe('<AchievementCelebration />', () => {
  beforeEach(() => {
    reset()
    vi.useFakeTimers({ shouldAdvanceTime: false })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when the queue is empty', () => {
    render(<AchievementCelebration />)
    expect(
      screen.queryByTestId('achievement-celebration'),
    ).not.toBeInTheDocument()
  })

  it('shows the head event from the queue', () => {
    render(<AchievementCelebration />)
    act(() => {
      useAchievementsStore.getState().enqueueAchievements([
        event({ id: 'badge:volume-1', kind: 'badge', title: 'Premier Bloc' }),
      ])
    })
    expect(screen.getByTestId('achievement-celebration')).toBeInTheDocument()
    expect(screen.getByText('Premier Bloc')).toBeInTheDocument()
    expect(screen.getByText(/Badge débloqué/i)).toBeInTheDocument()
  })

  it('uses the correct headline per kind', () => {
    render(<AchievementCelebration />)
    act(() => {
      useAchievementsStore.getState().enqueueAchievements([
        event({ id: 'streak:7', kind: 'streak', title: 'Semaine de feu' }),
      ])
    })
    expect(screen.getByText(/Streak atteint/i)).toBeInTheDocument()
  })

  it('auto-dismisses after the timeout', () => {
    render(<AchievementCelebration />)
    act(() => {
      useAchievementsStore.getState().enqueueAchievements([
        event({ id: 'badge:x', kind: 'badge', title: 'X' }),
      ])
    })
    expect(screen.getByTestId('achievement-celebration')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(
      screen.queryByTestId('achievement-celebration'),
    ).not.toBeInTheDocument()
  })

  it('dismisses on click and pulls the next event', () => {
    render(<AchievementCelebration />)
    act(() => {
      useAchievementsStore.getState().enqueueAchievements([
        event({ id: 'badge:a', kind: 'badge', title: 'First' }),
        event({ id: 'badge:b', kind: 'badge', title: 'Second' }),
      ])
    })
    expect(screen.getByText('First')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByTestId('achievement-celebration'))
    })

    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
