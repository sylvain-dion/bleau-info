import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { useTickStore } from '@/stores/tick-store'
import { useAnnotationStore } from '@/stores/annotation-store'
import type { User } from '@supabase/supabase-js'
import type { Tick } from '@/lib/validations/tick'

// Mock recharts — jsdom cannot render SVG charts.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Line: () => null,
  ReferenceLine: () => null,
}))

// Import AFTER mocks.
const { default: MesAscensionsPage } = await import(
  '@/app/(auth)/profil/mes-ascensions/page'
)

const mockUser = {
  id: 'user-1',
  email: 'test@bleau.fr',
  user_metadata: { full_name: 'Test User' },
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

function makeTick(overrides: Partial<Tick> = {}): Tick {
  return {
    id: 'tick-1',
    userId: 'user-1',
    boulderId: 'boulder-1',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    tickStyle: 'flash',
    tickDate: '2026-01-15',
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('MesAscensionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTickStore.setState({ ticks: [] })
    useAnnotationStore.setState({ annotations: [] })
  })

  it('shows loading spinner when auth is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true })
    const { container } = render(<MesAscensionsPage />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders nothing when user is null', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    const { container } = render(<MesAscensionsPage />)
    expect(container.innerHTML).toBe('')
  })

  it('shows the global header with the back link to /profil', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<MesAscensionsPage />)
    expect(screen.getByText('Mes ascensions')).toBeDefined()
    expect(
      screen.getByText('Carnet, circuits et statistiques'),
    ).toBeDefined()
    const back = screen.getByRole('link', { name: /Retour au profil/ })
    expect(back.getAttribute('href')).toBe('/profil')
  })

  it('renders three tab buttons', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<MesAscensionsPage />)
    expect(screen.getByTestId('tab-ascents')).toBeDefined()
    expect(screen.getByTestId('tab-circuits')).toBeDefined()
    expect(screen.getByTestId('tab-stats')).toBeDefined()
  })

  it('shows the empty state on the ascents tab when no ticks', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    useTickStore.setState({ ticks: [] })
    render(<MesAscensionsPage />)
    expect(screen.getByText('Aucune croix')).toBeDefined()
  })

  describe('with tick data', () => {
    const testTicks: Tick[] = [
      makeTick({
        id: '1',
        boulderId: 'b1',
        boulderGrade: '6a',
        tickStyle: 'flash',
        tickDate: '2026-01-10',
      }),
      makeTick({
        id: '2',
        boulderId: 'b2',
        boulderGrade: '6b',
        tickStyle: 'a_vue',
        tickDate: '2026-01-20',
      }),
      makeTick({
        id: '3',
        boulderId: 'b1',
        boulderGrade: '6a',
        tickStyle: 'travaille',
        tickDate: '2026-02-05',
      }),
    ]

    beforeEach(() => {
      useAuthStore.setState({ user: mockUser, isLoading: false })
      useTickStore.setState({ ticks: testTicks })
    })

    it('shows the global summary cards (uniqueBoulders / totalTicks)', () => {
      render(<MesAscensionsPage />)
      // 2 unique boulders (b1, b2)
      expect(screen.getByText('Blocs uniques')).toBeDefined()
      expect(screen.getByText('2')).toBeDefined()
      // 3 total ticks
      expect(screen.getByText('Croix totales')).toBeDefined()
      expect(screen.getByText('3')).toBeDefined()
    })

    it('renders the toolbar and ascents list on the ascents tab', () => {
      render(<MesAscensionsPage />)
      expect(screen.getByTestId('ascents-toolbar')).toBeDefined()
      expect(screen.getByTestId('ascents-list')).toBeDefined()
    })

    it('switches to the stats tab and renders the chart sections', () => {
      render(<MesAscensionsPage />)
      fireEvent.click(screen.getByTestId('tab-stats'))
      expect(screen.getByText('Ascensions par mois')).toBeDefined()
      expect(screen.getByText('Répartition par cotation')).toBeDefined()
      expect(screen.getByText("Style d'ascension")).toBeDefined()
    })

    it('renders chart containers on the stats tab', () => {
      render(<MesAscensionsPage />)
      fireEvent.click(screen.getByTestId('tab-stats'))
      const rechartsContainers = screen.getAllByTestId('responsive-container')
      expect(rechartsContainers.length).toBeGreaterThan(0)
      const pieChart = screen.getByLabelText(
        "Graphique de répartition par style d'ascension",
      )
      expect(pieChart).toBeDefined()
    })

    it('shows the annotation button on the stats tab', () => {
      render(<MesAscensionsPage />)
      fireEvent.click(screen.getByTestId('tab-stats'))
      expect(screen.getByText('Annoter')).toBeDefined()
    })

    it('switches to the circuits tab', () => {
      render(<MesAscensionsPage />)
      fireEvent.click(screen.getByTestId('tab-circuits'))
      // Either we see the empty state or grouped circuits — but never the
      // "Aucune croix" message of the ascents tab.
      expect(screen.queryByText('Aucune croix')).toBeNull()
    })
  })
})
