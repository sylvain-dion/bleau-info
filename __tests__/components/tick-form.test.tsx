import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TickForm } from '@/components/boulder/tick-form'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

// Mock feedback module
vi.mock('@/lib/feedback', () => ({
  triggerTickFeedback: vi.fn(),
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2025-06-15T10:30:00Z',
  user_metadata: { display_name: 'Test User' },
  app_metadata: {},
  aud: 'authenticated',
} as unknown as User

describe('TickForm', () => {
  const defaultProps = {
    boulderId: 'boulder-42',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useTickStore.setState({ ticks: [] })
    useAuthStore.setState({ user: mockUser, isLoading: false })
  })

  it('should render the form with all fields', () => {
    render(<TickForm {...defaultProps} />)

    expect(screen.getByText('Logger une croix')).toBeInTheDocument()
    expect(screen.getByText('Flash')).toBeInTheDocument()
    expect(screen.getByText('À vue')).toBeInTheDocument()
    expect(screen.getByText('Travaillé')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText(/Note personnelle/)).toBeInTheDocument()
    expect(screen.getByText('Valider')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('should default date to today', () => {
    render(<TickForm {...defaultProps} />)
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement
    const today = new Date().toISOString().slice(0, 10)
    expect(dateInput.value).toBe(today)
  })

  it('should call onClose when cancel is clicked', () => {
    render(<TickForm {...defaultProps} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when X button is clicked', () => {
    render(<TickForm {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should show validation error when submitting without style', async () => {
    render(<TickForm {...defaultProps} />)
    fireEvent.click(screen.getByText('Valider'))

    // Zod enum rejects empty string — error message should appear
    await waitFor(() => {
      const errors = document.querySelectorAll('.text-destructive')
      expect(errors.length).toBeGreaterThan(0)
    })

    // Should NOT have added a tick
    expect(useTickStore.getState().ticks).toHaveLength(0)
  })

  it('should submit form with valid data and add tick to store', async () => {
    const { triggerTickFeedback } = await import('@/lib/feedback')

    render(<TickForm {...defaultProps} />)

    // Select style
    fireEvent.click(screen.getByText('Flash'))

    // Submit
    fireEvent.click(screen.getByText('Valider'))

    await waitFor(() => {
      const ticks = useTickStore.getState().ticks
      expect(ticks).toHaveLength(1)
      expect(ticks[0].boulderId).toBe('boulder-42')
      expect(ticks[0].boulderName).toBe('La Marie-Rose')
      expect(ticks[0].boulderGrade).toBe('6a')
      expect(ticks[0].tickStyle).toBe('flash')
    })

    expect(triggerTickFeedback).toHaveBeenCalledTimes(1)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
  })

  it('should submit form with personal note', async () => {
    render(<TickForm {...defaultProps} />)

    fireEvent.click(screen.getByText('À vue'))

    const noteInput = screen.getByLabelText(/Note personnelle/)
    fireEvent.change(noteInput, { target: { value: 'Magnifique journée' } })

    fireEvent.click(screen.getByText('Valider'))

    await waitFor(() => {
      const ticks = useTickStore.getState().ticks
      expect(ticks).toHaveLength(1)
      expect(ticks[0].tickStyle).toBe('a_vue')
      expect(ticks[0].personalNote).toBe('Magnifique journée')
    })
  })

  it('should render style selector with radiogroup role', () => {
    render(<TickForm {...defaultProps} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
  })
})
