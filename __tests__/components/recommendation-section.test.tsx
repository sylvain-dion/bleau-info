import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationSection } from '@/components/sector/recommendation-section'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import type { BoulderListItem } from '@/components/sector/boulder-list-card'
import type { Tick } from '@/lib/validations/tick'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const boulders: BoulderListItem[] = [
  { id: 'b-1', name: 'Dalle du Cul', grade: '5b', style: 'dalle', circuit: null, circuitNumber: null, exposure: null },
  { id: 'b-2', name: 'Le Surplomb', grade: '5c', style: 'devers', circuit: 'bleu', circuitNumber: 12, exposure: 'ombre' },
  { id: 'b-3', name: 'Arête Nord', grade: '6a', style: 'arete', circuit: null, circuitNumber: null, exposure: null },
  { id: 'b-4', name: 'Traversée Est', grade: '5a', style: 'traverse', circuit: 'rouge', circuitNumber: 3, exposure: null },
  { id: 'b-5', name: 'Le Toit', grade: '5b', style: 'toit', circuit: null, circuitNumber: null, exposure: null },
  { id: 'b-6', name: 'Bloc Simple', grade: '4a', style: 'bloc', circuit: 'jaune', circuitNumber: 1, exposure: null },
]

let tickId = 0

function makeTick(overrides: Partial<Tick> = {}): Tick {
  tickId++
  return {
    id: `t-${tickId}`,
    userId: 'user-1',
    boulderId: `tick-boulder-${tickId}`,
    boulderName: `Tick Bloc ${tickId}`,
    boulderGrade: '5b',
    tickStyle: 'flash',
    tickDate: `2026-03-0${Math.min(tickId, 9)}`,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function resetStores() {
  useTickStore.setState({ ticks: [] })
  useAuthStore.setState({ user: null, isLoading: false })
}

function setAuthenticated() {
  useAuthStore.setState({
    user: { id: 'user-1', email: 'test@test.com' } as never,
    isLoading: false,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RecommendationSection', () => {
  beforeEach(() => {
    tickId = 0
    resetStores()
  })

  it('renders nothing for unauthenticated users', () => {
    const { container } = render(<RecommendationSection boulders={boulders} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders collapsed accordion with "Populaires" for 0 ticks', () => {
    setAuthenticated()
    render(<RecommendationSection boulders={boulders} />)
    expect(screen.getByText('Populaires dans ce secteur')).toBeDefined()
    // Cards not visible when collapsed
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders collapsed accordion with "Populaires" for 4 ticks', () => {
    setAuthenticated()
    const ticks = Array.from({ length: 4 }, () => makeTick())
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)
    expect(screen.getByText('Populaires dans ce secteur')).toBeDefined()
  })

  it('renders collapsed accordion with "Recommandé pour toi" for 5+ ticks', () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)
    expect(screen.getByText('Recommandé pour toi')).toBeDefined()
    // Cards not visible when collapsed
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows count subtitle in collapsed state', () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)
    // Should show "X blocs basés sur tes dernières ascensions"
    const subtitle = screen.getByText(/blocs? basée?s? sur tes dernières ascensions/)
    expect(subtitle).toBeDefined()
  })

  it('expands to show cards when clicked', async () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)

    // Click to expand
    const button = screen.getByRole('button', { expanded: false })
    await userEvent.click(button)

    // Cards should now be visible
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    expect(links.length).toBeLessThanOrEqual(5)
  })

  it('each card links to boulder detail when expanded', async () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)

    await userEvent.click(screen.getByRole('button'))

    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/blocs\//)
    }
  })

  it('shows reason badges when expanded', async () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)

    await userEvent.click(screen.getByRole('button'))

    const badges = ['À ton niveau', 'Style que tu aimes', 'Populaire']
    const found = badges.some(
      (label) => screen.queryAllByText(label).length > 0
    )
    expect(found).toBe(true)
  })

  it('has correct aria-label for personalized', () => {
    setAuthenticated()
    const ticks = Array.from({ length: 6 }, (_, i) =>
      makeTick({ boulderGrade: '5b', tickDate: `2026-03-0${i + 1}` })
    )
    useTickStore.setState({ ticks })
    render(<RecommendationSection boulders={boulders} />)
    expect(
      screen.getByLabelText('Recommandations personnalisées')
    ).toBeDefined()
  })

  it('has correct aria-label for popular fallback', () => {
    setAuthenticated()
    render(<RecommendationSection boulders={boulders} />)
    expect(screen.getByLabelText('Blocs populaires')).toBeDefined()
  })

  it('button has aria-expanded attribute', () => {
    setAuthenticated()
    render(<RecommendationSection boulders={boulders} />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
