import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  MainNavProvider,
  MainNavLinks,
  MainNavMobileToggle,
} from '@/components/layout/main-nav'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ClimbingCall } from '@/lib/validations/climbing-call'
import type { User } from '@supabase/supabase-js'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeUser(id: string, name = 'Test User'): User {
  return {
    id,
    email: `${id}@example.com`,
    user_metadata: { display_name: name },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  } as unknown as User
}

function renderNav() {
  return render(
    <MainNavProvider>
      <MainNavLinks />
      <MainNavMobileToggle />
    </MainNavProvider>,
  )
}

const guest = makeUser('guest-1', 'Guest')

const seedCalls: ClimbingCall[] = [
  {
    id: 'c-1',
    hostUserId: 'host',
    hostName: 'Host',
    sectorSlug: 'apremont',
    sectorName: 'Apremont',
    plannedDate: addDays(2),
    message: '',
    createdAt: '2026-04-29T10:00:00Z',
  },
  {
    id: 'c-2',
    hostUserId: 'host',
    hostName: 'Host',
    sectorSlug: 'cul-de-chien',
    sectorName: 'Cul de Chien',
    plannedDate: addDays(3),
    message: '',
    createdAt: '2026-04-29T11:00:00Z',
  },
  {
    id: 'c-3',
    hostUserId: 'host',
    hostName: 'Host',
    sectorSlug: 'bas-cuvier',
    sectorName: 'Bas Cuvier',
    plannedDate: '2000-01-01', // past — should never be counted
    message: '',
    createdAt: '2026-04-29T12:00:00Z',
  },
]

describe('MainNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClimbingCallStore.setState({
      calls: seedCalls,
      responses: [],
      seeded: true,
    })
    useAuthStore.setState({ user: guest, isLoading: false })
  })

  it('renders the four desktop links', () => {
    renderNav()
    expect(screen.getByTestId('main-nav-link-secteurs')).toBeInTheDocument()
    expect(screen.getByTestId('main-nav-link-feed')).toBeInTheDocument()
    expect(screen.getByTestId('main-nav-link-grimpons')).toBeInTheDocument()
    expect(screen.getByTestId('main-nav-link-parcours')).toBeInTheDocument()
  })

  it('renders the burger button', () => {
    renderNav()
    expect(screen.getByTestId('main-nav-burger')).toBeInTheDocument()
  })

  it('shows the invitation count as a badge on the Grimpons link', () => {
    renderNav()
    const badge = screen.getByTestId('main-nav-badge-grimpons')
    expect(badge).toHaveTextContent('2')
  })

  it('shows the same count on the burger button', () => {
    renderNav()
    expect(screen.getByTestId('main-nav-burger-badge')).toHaveTextContent('2')
  })

  it('excludes calls hosted by the current user', () => {
    useAuthStore.setState({
      user: makeUser('host', 'Host'),
      isLoading: false,
    })
    renderNav()
    expect(
      screen.queryByTestId('main-nav-badge-grimpons'),
    ).toBeNull()
    expect(
      screen.queryByTestId('main-nav-burger-badge'),
    ).toBeNull()
  })

  it('excludes calls the user has already responded to', () => {
    useClimbingCallStore.setState({
      calls: seedCalls,
      responses: [
        {
          callId: 'c-1',
          userId: 'guest-1',
          userName: 'Guest',
          status: 'going',
          respondedAt: '2026-04-29T13:00:00Z',
        },
      ],
      seeded: true,
    })
    renderNav()
    expect(screen.getByTestId('main-nav-badge-grimpons')).toHaveTextContent('1')
  })

  it('does not render a badge when there are no relevant invitations', () => {
    useClimbingCallStore.setState({
      calls: [],
      responses: [],
      seeded: true,
    })
    renderNav()
    expect(screen.queryByTestId('main-nav-badge-grimpons')).toBeNull()
    expect(screen.queryByTestId('main-nav-burger-badge')).toBeNull()
  })

  it('caps the burger badge at 9+', () => {
    const many: ClimbingCall[] = Array.from({ length: 12 }, (_, i) => ({
      id: `c-${i}`,
      hostUserId: 'host',
      hostName: 'Host',
      sectorSlug: 's',
      sectorName: 'S',
      plannedDate: addDays(2),
      message: '',
      createdAt: `2026-04-29T${String(i).padStart(2, '0')}:00:00Z`,
    }))
    useClimbingCallStore.setState({
      calls: many,
      responses: [],
      seeded: true,
    })
    renderNav()
    expect(screen.getByTestId('main-nav-burger-badge')).toHaveTextContent('9+')
    expect(screen.getByTestId('main-nav-badge-grimpons')).toHaveTextContent('12')
  })

  it('opens and closes the mobile sheet', () => {
    renderNav()
    expect(screen.queryByTestId('main-nav-sheet')).toBeNull()

    fireEvent.click(screen.getByTestId('main-nav-burger'))
    expect(screen.getByTestId('main-nav-sheet')).toBeInTheDocument()
    expect(
      screen.getByTestId('main-nav-sheet-link-grimpons'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('main-nav-sheet-close'))
    expect(screen.queryByTestId('main-nav-sheet')).toBeNull()
  })

  it('closes the sheet when a link inside is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('main-nav-burger'))
    fireEvent.click(screen.getByTestId('main-nav-sheet-link-grimpons'))
    expect(screen.queryByTestId('main-nav-sheet')).toBeNull()
  })
})
