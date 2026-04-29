import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AscentsList } from '@/components/profile/ascents-list'
import type { Tick } from '@/lib/validations/tick'

function makeTick(
  overrides: Partial<Tick> & { tickDate: string; boulderGrade: string },
): Tick {
  const { tickDate, boulderGrade } = overrides
  return {
    id: overrides.id ?? `${tickDate}-${boulderGrade}`,
    userId: 'u1',
    boulderId: overrides.boulderId ?? 'b1',
    boulderName: overrides.boulderName ?? 'La Marie-Rose',
    boulderGrade,
    tickStyle: overrides.tickStyle ?? 'flash',
    tickDate,
    personalNote: overrides.personalNote ?? '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: overrides.createdAt ?? `${tickDate}T12:00:00Z`,
  }
}

describe('AscentsList', () => {
  it('renders the empty state when no ticks are provided', () => {
    render(<AscentsList ticks={[]} />)
    expect(screen.getByTestId('ascents-empty')).toBeInTheDocument()
    expect(screen.getByTestId('ascents-empty').textContent).toMatch(
      /Aucune ascension/,
    )
  })

  it('uses the custom empty message when provided', () => {
    render(<AscentsList ticks={[]} emptyMessage="Pas de résultats" />)
    expect(screen.getByTestId('ascents-empty').textContent).toMatch(
      /Pas de résultats/,
    )
  })

  it('renders one row per tick', () => {
    const ticks = [
      makeTick({
        tickDate: '2026-01-10',
        boulderGrade: '4a',
        boulderName: 'Alpha',
        boulderId: 'a',
      }),
      makeTick({
        tickDate: '2026-02-10',
        boulderGrade: '6b',
        boulderName: 'Beta',
        boulderId: 'b',
      }),
    ]
    render(<AscentsList ticks={ticks} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    // Grade badges are uppercased.
    expect(screen.getByText('4A')).toBeInTheDocument()
    expect(screen.getByText('6B')).toBeInTheDocument()
  })

  it('shows the personal note when present', () => {
    const ticks = [
      makeTick({
        tickDate: '2026-01-10',
        boulderGrade: '5a',
        personalNote: 'Beta avec talon',
      }),
    ]
    render(<AscentsList ticks={ticks} />)
    expect(screen.getByText(/Beta avec talon/)).toBeInTheDocument()
  })

  it('links each row to the boulder detail page', () => {
    const ticks = [
      makeTick({
        tickDate: '2026-01-10',
        boulderGrade: '5a',
        boulderId: 'cuvier-marie-rose',
        boulderName: 'La Marie-Rose',
      }),
    ]
    render(<AscentsList ticks={ticks} />)
    const link = screen.getByRole('link', { name: 'La Marie-Rose' })
    expect(link.getAttribute('href')).toBe('/blocs/cuvier-marie-rose')
  })
})
