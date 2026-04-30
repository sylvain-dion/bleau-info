import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CallForm } from '@/components/calls/call-form'
import { useClimbingCallStore } from '@/stores/climbing-call-store'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

const mockUser = {
  id: 'user-123',
  email: 'host@example.com',
  user_metadata: { display_name: 'Test Host' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('CallForm', () => {
  const defaultProps = {
    defaultSectorSlug: 'apremont',
    defaultSectorName: 'Apremont',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useClimbingCallStore.setState({ calls: [], responses: [], seeded: true })
    useAuthStore.setState({ user: mockUser, isLoading: false })
  })

  it('renders form fields and a submit button when authenticated', () => {
    render(<CallForm {...defaultProps} />)

    expect(screen.getByText('Lancer un appel à grimper')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText(/Heure/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
    expect(screen.getByText("Lancer l'appel")).toBeInTheDocument()
  })

  it('shows a "connectez-vous" prompt when no user is signed in', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    render(<CallForm {...defaultProps} />)
    expect(
      screen.getByText('Connectez-vous pour lancer un appel'),
    ).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', () => {
    render(<CallForm {...defaultProps} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('rejects a date in the past', async () => {
    render(<CallForm {...defaultProps} />)

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2000-01-01' } })
    fireEvent.click(screen.getByText("Lancer l'appel"))

    await waitFor(() => {
      expect(useClimbingCallStore.getState().calls).toHaveLength(0)
    })
  })

  it('creates a call with the form data on submit', async () => {
    render(<CallForm {...defaultProps} />)

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: addDays(3) } })

    const messageInput = screen.getByLabelText(/Message/)
    fireEvent.change(messageInput, { target: { value: 'On y va !' } })

    fireEvent.click(screen.getByText("Lancer l'appel"))

    await waitFor(() => {
      const calls = useClimbingCallStore.getState().calls
      expect(calls).toHaveLength(1)
      expect(calls[0].sectorSlug).toBe('apremont')
      expect(calls[0].message).toBe('On y va !')
      expect(calls[0].hostUserId).toBe('user-123')
      expect(calls[0].hostName).toBe('Test Host')
    })

    expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('rejects when no sector is chosen', async () => {
    render(<CallForm onClose={vi.fn()} onSuccess={vi.fn()} />)

    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: addDays(3) } })

    fireEvent.click(screen.getByText("Lancer l'appel"))

    await waitFor(() => {
      expect(useClimbingCallStore.getState().calls).toHaveLength(0)
    })
  })
})
