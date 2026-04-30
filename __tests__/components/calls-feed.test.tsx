import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CallsFeed } from '@/components/calls/calls-feed'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ClimbingCall } from '@/lib/validations/climbing-call'
import type { User } from '@supabase/supabase-js'

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const baseUser = {
  id: 'guest-1',
  email: 'guest@example.com',
  user_metadata: { display_name: 'Guest' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

const callApremont: ClimbingCall = {
  id: 'c-apremont',
  hostUserId: 'host',
  hostName: 'Host',
  sectorSlug: 'apremont',
  sectorName: 'Apremont',
  plannedDate: addDays(2),
  message: '',
  createdAt: '2026-04-29T10:00:00Z',
}

const callCulDeChien: ClimbingCall = {
  id: 'c-cul',
  hostUserId: 'host',
  hostName: 'Host',
  sectorSlug: 'cul-de-chien',
  sectorName: 'Cul de Chien',
  plannedDate: addDays(3),
  message: '',
  createdAt: '2026-04-29T11:00:00Z',
}

describe('CallsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClimbingCallStore.setState({
      calls: [callApremont, callCulDeChien],
      responses: [],
      seeded: true,
    })
    useAuthStore.setState({ user: baseUser, isLoading: false })
  })

  it('renders all active calls when no sector filter is set', () => {
    render(<CallsFeed />)
    expect(screen.getAllByTestId('call-card')).toHaveLength(2)
  })

  it('filters calls by sectorSlug', () => {
    render(<CallsFeed sectorSlug="apremont" sectorName="Apremont" />)
    const cards = screen.getAllByTestId('call-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveAttribute('data-call-id', 'c-apremont')
  })

  it('shows empty state when there are no calls', () => {
    useClimbingCallStore.setState({
      calls: [],
      responses: [],
      seeded: true,
    })
    render(<CallsFeed />)
    expect(screen.getByTestId('calls-feed-empty')).toBeInTheDocument()
  })

  it('opens the form when the "Lancer un appel" button is clicked', () => {
    render(<CallsFeed />)
    fireEvent.click(screen.getByTestId('calls-feed-open-form'))
    expect(screen.getByText('Lancer un appel à grimper')).toBeInTheDocument()
  })

  it('hides the open-form button for anonymous users', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    render(<CallsFeed />)
    expect(screen.queryByTestId('calls-feed-open-form')).toBeNull()
  })

  it('uses a custom title when provided', () => {
    render(<CallsFeed title="Appels prévus ici" />)
    expect(screen.getByText(/Appels prévus ici/)).toBeInTheDocument()
  })

  it('skips past calls', () => {
    useClimbingCallStore.setState({
      calls: [
        { ...callApremont, plannedDate: '2000-01-01' },
      ],
      responses: [],
      seeded: true,
    })
    render(<CallsFeed />)
    expect(screen.queryAllByTestId('call-card')).toHaveLength(0)
    expect(screen.getByTestId('calls-feed-empty')).toBeInTheDocument()
  })
})
