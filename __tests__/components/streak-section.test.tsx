import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreakSection } from '@/components/profile/streak-section'
import type { Tick } from '@/lib/validations/tick'

function makeTick(tickDate: string, id = tickDate): Tick {
  return {
    id,
    userId: 'u1',
    boulderId: 'cul-de-chien-1',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    tickStyle: 'flash',
    tickDate,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: `${tickDate}T12:00:00Z`,
  }
}

// Freeze "today" so the streak math is deterministic.
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 3, 27)) // Mon 2026-04-27
})

afterAll(() => {
  vi.useRealTimers()
})

describe('StreakSection — empty state', () => {
  it('shows the prompt when there are no ticks', () => {
    render(<StreakSection ticks={[]} />)
    expect(
      screen.getByText(/Loggez votre première croix/i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('activity-calendar')).not.toBeInTheDocument()
  })
})

describe('StreakSection — populated', () => {
  it('renders the three streak stat tiles', () => {
    const ticks = [
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    render(<StreakSection ticks={ticks} />)
    expect(screen.getByText('Streak actuel')).toBeInTheDocument()
    expect(screen.getByText('Record')).toBeInTheDocument()
    expect(screen.getByText('Jours grimpés')).toBeInTheDocument()
  })

  it('shows the streak count with plural unit', () => {
    const ticks = [
      makeTick('2026-04-25'),
      makeTick('2026-04-26'),
      makeTick('2026-04-27'),
    ]
    render(<StreakSection ticks={ticks} />)
    // current streak (3) and longest streak (3) both render "3 jours"
    expect(screen.getAllByText('3 jours')).toHaveLength(2)
  })

  it('renders the activity calendar', () => {
    render(<StreakSection ticks={[makeTick('2026-04-27')]} />)
    expect(screen.getByTestId('activity-calendar')).toBeInTheDocument()
  })

  it('reflects multi-tick days in calendar cell aria-labels', () => {
    const ticks = [
      makeTick('2026-04-27', 'a'),
      makeTick('2026-04-27', 'b'),
      makeTick('2026-04-27', 'c'),
    ]
    render(<StreakSection ticks={ticks} />)
    // The cell for today should report "3 croix" in its aria-label
    const cell = screen.getByLabelText(/27 avr.*3 croix/i)
    expect(cell).toBeInTheDocument()
  })

  it('uses singular "jour" for a streak of 1', () => {
    const ticks = [makeTick('2026-04-27')]
    render(<StreakSection ticks={ticks} />)
    // Both currentStreak and longestStreak are 1; should not pluralize
    expect(screen.getAllByText('1 jour')).toHaveLength(2)
  })
})
