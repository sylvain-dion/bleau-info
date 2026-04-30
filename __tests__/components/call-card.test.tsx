import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CallCard } from '@/components/calls/call-card'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import type { ClimbingCall } from '@/lib/validations/climbing-call'
import type { User } from '@supabase/supabase-js'

const baseCall: ClimbingCall = {
  id: 'call-1',
  hostUserId: 'host-1',
  hostName: 'Host User',
  sectorSlug: 'apremont',
  sectorName: 'Apremont',
  plannedDate: '2026-12-31',
  startTime: '10:00',
  targetGrade: '6a — 7a',
  message: 'Petit message du host.',
  createdAt: '2026-04-30T10:00:00Z',
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

describe('CallCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClimbingCallStore.setState({
      calls: [baseCall],
      responses: [],
      seeded: true,
    })
    // Default to a non-host user so RSVP controls render.
    useAuthStore.setState({ user: makeUser('guest-1', 'Guest'), isLoading: false })
  })

  it('renders the host name, sector, date and message', () => {
    render(<CallCard call={baseCall} />)

    expect(screen.getByText('Host User')).toBeInTheDocument()
    expect(screen.getByText('Apremont')).toBeInTheDocument()
    expect(screen.getByText('Petit message du host.')).toBeInTheDocument()
    expect(screen.getByText('6a — 7a')).toBeInTheDocument()
  })

  it('hides the sector tag when hideSector=true', () => {
    render(<CallCard call={baseCall} hideSector />)
    expect(screen.queryByText('Apremont')).toBeNull()
  })

  it('shows a delete button to the host and not to others', () => {
    useAuthStore.setState({
      user: makeUser('host-1', 'Host User'),
      isLoading: false,
    })
    render(<CallCard call={baseCall} />)
    expect(screen.getByTestId('call-card-delete')).toBeInTheDocument()
    expect(screen.queryByTestId('call-card-going')).toBeNull()
  })

  it('shows RSVP buttons to non-host users', () => {
    render(<CallCard call={baseCall} />)
    expect(screen.getByTestId('call-card-going')).toBeInTheDocument()
    expect(screen.getByTestId('call-card-maybe')).toBeInTheDocument()
    expect(screen.queryByTestId('call-card-delete')).toBeNull()
  })

  it('records a "going" RSVP when the button is clicked', () => {
    render(<CallCard call={baseCall} />)
    fireEvent.click(screen.getByTestId('call-card-going'))

    const responses = useClimbingCallStore.getState().responses
    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe('going')
    expect(responses[0].userId).toBe('guest-1')
  })

  it('toggles off when the same RSVP button is clicked twice', () => {
    render(<CallCard call={baseCall} />)
    fireEvent.click(screen.getByTestId('call-card-going'))
    fireEvent.click(screen.getByTestId('call-card-going'))
    expect(useClimbingCallStore.getState().responses).toHaveLength(0)
  })

  it('switches status when clicking the other RSVP button', () => {
    render(<CallCard call={baseCall} />)
    fireEvent.click(screen.getByTestId('call-card-going'))
    fireEvent.click(screen.getByTestId('call-card-maybe'))

    const responses = useClimbingCallStore.getState().responses
    expect(responses).toHaveLength(1)
    expect(responses[0].status).toBe('maybe')
  })

  it('shows a login link to anonymous users', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    render(<CallCard call={baseCall} />)
    expect(screen.getByText('Connecte-toi pour répondre')).toBeInTheDocument()
    expect(screen.queryByTestId('call-card-going')).toBeNull()
  })

  it('counts how many people are going', () => {
    useClimbingCallStore.setState({
      calls: [baseCall],
      responses: [
        {
          callId: 'call-1',
          userId: 'a',
          userName: 'A',
          status: 'going',
          respondedAt: '2026-04-30T10:00:00Z',
        },
        {
          callId: 'call-1',
          userId: 'b',
          userName: 'B',
          status: 'going',
          respondedAt: '2026-04-30T10:01:00Z',
        },
        {
          callId: 'call-1',
          userId: 'c',
          userName: 'C',
          status: 'maybe',
          respondedAt: '2026-04-30T10:02:00Z',
        },
      ],
      seeded: true,
    })
    render(<CallCard call={baseCall} />)
    expect(screen.getByText(/2 grimpeurs/)).toBeInTheDocument()
    expect(screen.getByText(/1 peut-être/)).toBeInTheDocument()
  })
})
