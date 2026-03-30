import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectorStatsTab } from '@/components/sector/sector-stats-tab'
import { useTickStore } from '@/stores/tick-store'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'
import type { Tick } from '@/lib/validations/tick'

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

import { vi } from 'vitest'

const boulders: BoulderListItem[] = [
  { id: 'b-1', name: 'La Marie-Rose', grade: '6a', style: 'dalle', circuit: 'rouge', circuitNumber: 1, exposure: 'soleil' },
  { id: 'b-2', name: 'Le Surplomb', grade: '6b', style: 'devers', circuit: 'bleu', circuitNumber: 2, exposure: null },
  { id: 'b-3', name: 'La Fissure', grade: '3b', style: 'bloc', circuit: 'jaune', circuitNumber: 8, exposure: null },
  { id: 'b-4', name: 'Le Pilier', grade: '6c', style: 'arete', circuit: null, circuitNumber: null, exposure: null },
]

let tickId = 0
function makeTick(overrides: Partial<Tick> = {}): Tick {
  tickId++
  return {
    id: `t-${tickId}`,
    userId: 'user-1',
    boulderId: 'b-1',
    boulderName: 'Test',
    boulderGrade: '6a',
    tickStyle: 'flash',
    tickDate: '2026-03-15',
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('SectorStatsTab', () => {
  beforeEach(() => {
    tickId = 0
    useTickStore.setState({ ticks: [] })
  })

  it('renders summary cards with boulder count', () => {
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.getByText('Blocs')).toBeDefined()
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1)
  })

  it('renders grade distribution chart', () => {
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.getByText('Répartition par cotation')).toBeDefined()
  })

  it('renders top climbed section when ticks exist', () => {
    const ticks = Array.from({ length: 3 }, () =>
      makeTick({ boulderId: 'b-1' })
    )
    useTickStore.setState({ ticks })
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.getByText('Les plus grimpés ce mois')).toBeDefined()
  })

  it('renders top rated section when consensus exists', () => {
    // 6 votes with perceived grade → consensus reached
    const ticks = Array.from({ length: 6 }, () =>
      makeTick({ boulderId: 'b-1', perceivedGrade: '6a+' })
    )
    useTickStore.setState({ ticks })
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.getByText('Les mieux notés')).toBeDefined()
  })

  it('does not render top rated when no consensus', () => {
    // Only 2 votes — below threshold
    const ticks = [
      makeTick({ boulderId: 'b-1', perceivedGrade: '6a' }),
      makeTick({ boulderId: 'b-1', perceivedGrade: '6b' }),
    ]
    useTickStore.setState({ ticks })
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.queryByText('Les mieux notés')).toBeNull()
  })

  it('shows ascent count in monthly card', () => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const ticks = [
      makeTick({ boulderId: 'b-1', tickDate: `${currentMonth}-05` }),
      makeTick({ boulderId: 'b-2', tickDate: `${currentMonth}-10` }),
    ]
    useTickStore.setState({ ticks })
    render(<SectorStatsTab boulders={boulders} />)
    expect(screen.getByText('Ascensions ce mois')).toBeDefined()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('boulder links point to detail pages', () => {
    const ticks = Array.from({ length: 3 }, () =>
      makeTick({ boulderId: 'b-1' })
    )
    useTickStore.setState({ ticks })
    render(<SectorStatsTab boulders={boulders} />)
    const links = screen.getAllByRole('link')
    const boulderLinks = links.filter((l) =>
      l.getAttribute('href')?.startsWith('/blocs/')
    )
    expect(boulderLinks.length).toBeGreaterThan(0)
  })

  it('renders empty for zero boulders', () => {
    render(<SectorStatsTab boulders={[]} />)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })
})
