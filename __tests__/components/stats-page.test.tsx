import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { useTickStore } from '@/stores/tick-store'
import { useAnnotationStore } from '@/stores/annotation-store'
import type { User } from '@supabase/supabase-js'
import type { Tick } from '@/lib/validations/tick'

// Mock recharts — jsdom cannot render SVG charts
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

// Import AFTER mocks
const { default: StatistiquesPage } = await import('@/app/(auth)/statistiques/page')

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
    createdAt: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('StatistiquesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTickStore.setState({ ticks: [] })
    useAnnotationStore.setState({ annotations: [] })
  })

  it('shows loading spinner when auth is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true })
    const { container } = render(<StatistiquesPage />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders nothing when user is null', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    const { container } = render(<StatistiquesPage />)
    expect(container.innerHTML).toBe('')
  })

  it('shows empty state when no ticks', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    useTickStore.setState({ ticks: [] })
    render(<StatistiquesPage />)
    expect(screen.getByText('Aucune statistique')).toBeDefined()
    expect(screen.getByText(/Loguez vos premières croix/)).toBeDefined()
  })

  it('shows page header', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<StatistiquesPage />)
    expect(screen.getByText('Statistiques')).toBeDefined()
    expect(screen.getByText('Votre progression en bloc')).toBeDefined()
  })

  describe('with tick data', () => {
    const testTicks: Tick[] = [
      makeTick({ id: '1', boulderId: 'b1', boulderGrade: '6a', tickStyle: 'flash', tickDate: '2026-01-10' }),
      makeTick({ id: '2', boulderId: 'b2', boulderGrade: '6b', tickStyle: 'a_vue', tickDate: '2026-01-20' }),
      makeTick({ id: '3', boulderId: 'b1', boulderGrade: '6a', tickStyle: 'travaille', tickDate: '2026-02-05' }),
    ]

    beforeEach(() => {
      useAuthStore.setState({ user: mockUser, isLoading: false })
      useTickStore.setState({ ticks: testTicks })
    })

    it('shows summary cards with correct values', () => {
      render(<StatistiquesPage />)
      // 2 unique boulders (b1, b2)
      expect(screen.getByText('2')).toBeDefined()
      expect(screen.getByText('Blocs uniques')).toBeDefined()
      // 3 total ticks
      expect(screen.getByText('3')).toBeDefined()
      expect(screen.getByText('Croix totales')).toBeDefined()
    })

    it('renders all chart sections', () => {
      render(<StatistiquesPage />)
      expect(screen.getByText('Ascensions par mois')).toBeDefined()
      expect(screen.getByText('Répartition par cotation')).toBeDefined()
      expect(screen.getByText("Style d'ascension")).toBeDefined()
    })

    it('renders chart containers', () => {
      render(<StatistiquesPage />)
      // 2 Recharts ResponsiveContainers (timeline + grade) + 1 SVG pie chart
      const rechartsContainers = screen.getAllByTestId('responsive-container')
      expect(rechartsContainers).toHaveLength(2)
      // Pie chart renders as native SVG
      const pieChart = screen.getByLabelText("Graphique de répartition par style d'ascension")
      expect(pieChart).toBeDefined()
    })

    it('does not show empty state when ticks exist', () => {
      render(<StatistiquesPage />)
      expect(screen.queryByText('Aucune statistique')).toBeNull()
    })

    it('shows annotation button', () => {
      render(<StatistiquesPage />)
      expect(screen.getByText('Annoter')).toBeDefined()
    })

    it('does not show annotation list when no annotations', () => {
      render(<StatistiquesPage />)
      expect(screen.queryByText(/Annotations \(/)).toBeNull()
    })
  })
})
