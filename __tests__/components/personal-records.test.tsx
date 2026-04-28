import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonalRecords } from '@/components/profile/personal-records'
import type { Tick } from '@/lib/validations/tick'

function makeTick(
  overrides: Partial<Tick> & { tickDate: string; boulderGrade: string },
): Tick {
  const { tickDate, boulderGrade } = overrides
  return {
    id: overrides.id ?? `${tickDate}-${boulderGrade}`,
    userId: 'u1',
    boulderId: overrides.boulderId ?? 'cul-de-chien-1',
    boulderName: overrides.boulderName ?? 'La Marie-Rose',
    boulderGrade,
    tickStyle: overrides.tickStyle ?? 'flash',
    tickDate,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: overrides.createdAt ?? `${tickDate}T12:00:00Z`,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 3, 28))
})

describe('PersonalRecords', () => {
  it('renders nothing when there are no qualifying records', () => {
    const { container } = render(<PersonalRecords ticks={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one record per tier crossed', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-10', boulderGrade: '4a' }),
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-03-10', boulderGrade: '6a' }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.getByTestId('record-4a')).toBeInTheDocument()
    expect(screen.getByTestId('record-5a')).toBeInTheDocument()
    expect(screen.getByTestId('record-6a')).toBeInTheDocument()
    expect(screen.queryByTestId('record-7a')).not.toBeInTheDocument()
  })

  it('renders a single 6c+ tick as crossing 4a/5a/6a tiers', () => {
    const ticks = [
      makeTick({
        tickDate: '2026-04-15',
        boulderGrade: '6c+',
        boulderName: 'L\u2019Insoutenable',
      }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.getByTestId('record-4a')).toBeInTheDocument()
    expect(screen.getByTestId('record-5a')).toBeInTheDocument()
    expect(screen.getByTestId('record-6a')).toBeInTheDocument()
    // The boulder name appears on each record card.
    expect(screen.getAllByText(/L.Insoutenable.*\(6C\+\)/i).length).toBeGreaterThan(0)
  })

  it('shows the localized headline for each tier', () => {
    const ticks = [makeTick({ tickDate: '2026-04-10', boulderGrade: '6a' })]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.getByText('Premier 4ᵉ degré')).toBeInTheDocument()
    expect(screen.getByText('Premier 5ᵉ degré')).toBeInTheDocument()
    expect(screen.getByText('Premier 6ᵉ degré')).toBeInTheDocument()
  })

  it('renders one share button per record', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-10', boulderGrade: '4a' }),
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    const buttons = screen.getAllByTestId('share-button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].getAttribute('aria-label')).toMatch(/Partager le record/)
  })

  it('omits the sparkline when fewer than 2 active months exist', () => {
    const ticks = [makeTick({ tickDate: '2026-04-10', boulderGrade: '6a' })]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.queryByTestId('grade-timeline')).not.toBeInTheDocument()
  })

  it('renders the sparkline once 2 or more months have ticks', () => {
    const ticks = [
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-03-10', boulderGrade: '6a' }),
      makeTick({ tickDate: '2026-04-10', boulderGrade: '6b' }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.getByTestId('grade-timeline')).toBeInTheDocument()
  })

  it('shows the peak grade label in the sparkline header', () => {
    const ticks = [
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
      makeTick({ tickDate: '2026-04-10', boulderGrade: '6B' }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    const card = screen.getByTestId('grade-timeline')
    expect(card.textContent).toContain('6B')
  })

  it('counts the number of records in the heading', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-10', boulderGrade: '4a' }),
      makeTick({ tickDate: '2026-02-10', boulderGrade: '5a' }),
    ]
    render(<PersonalRecords ticks={ticks} />)
    // 2 jalons (plural)
    expect(screen.getByText(/2 jalons/)).toBeInTheDocument()
  })

  it('uses singular form for a single record', () => {
    const ticks = [makeTick({ tickDate: '2026-01-10', boulderGrade: '4a' })]
    render(<PersonalRecords ticks={ticks} />)
    expect(screen.getByText(/^1 jalon$/)).toBeInTheDocument()
  })
})
