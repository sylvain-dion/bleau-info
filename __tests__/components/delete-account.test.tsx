import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { display_name: 'Test' },
} as unknown as User

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: mockUser, isLoading: false })
  })

  it('should render the delete button', () => {
    render(<DeleteAccountDialog />)
    expect(screen.getByText('Supprimer mon compte')).toBeInTheDocument()
  })

  it('should open dialog when button is clicked', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    expect(screen.getByText('Supprimer le compte')).toBeInTheDocument()
    expect(screen.getByText('Cette action est irréversible.')).toBeInTheDocument()
  })

  it('should have disabled confirm button initially', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const confirmButton = screen.getByText('Confirmer la suppression')
    expect(confirmButton.closest('button')).toBeDisabled()
  })

  it('should enable confirm button when SUPPRIMER is typed', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const input = screen.getByPlaceholderText('SUPPRIMER')
    fireEvent.change(input, { target: { value: 'SUPPRIMER' } })

    const confirmButton = screen.getByText('Confirmer la suppression')
    expect(confirmButton.closest('button')).not.toBeDisabled()
  })

  it('should NOT enable confirm button with wrong text', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const input = screen.getByPlaceholderText('SUPPRIMER')
    fireEvent.change(input, { target: { value: 'supprimer' } })

    const confirmButton = screen.getByText('Confirmer la suppression')
    expect(confirmButton.closest('button')).toBeDisabled()
  })

  it('should close dialog when Annuler is clicked', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))
    expect(screen.getByText('Supprimer le compte')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Annuler'))
    expect(screen.queryByText('Supprimer le compte')).not.toBeInTheDocument()
  })

  it('should close dialog when X button is clicked', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(screen.queryByText('Supprimer le compte')).not.toBeInTheDocument()
  })

  it('should call DELETE API and redirect on successful deletion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const input = screen.getByPlaceholderText('SUPPRIMER')
    fireEvent.change(input, { target: { value: 'SUPPRIMER' } })
    fireEvent.click(screen.getByText('Confirmer la suppression'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/delete-account', { method: 'DELETE' })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalled()
    })

    // Auth store should be cleared
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should display error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Impossible de supprimer' }),
    })

    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const input = screen.getByPlaceholderText('SUPPRIMER')
    fireEvent.change(input, { target: { value: 'SUPPRIMER' } })
    fireEvent.click(screen.getByText('Confirmer la suppression'))

    await waitFor(() => {
      expect(screen.getByText('Impossible de supprimer')).toBeInTheDocument()
    })

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should display error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    const input = screen.getByPlaceholderText('SUPPRIMER')
    fireEvent.change(input, { target: { value: 'SUPPRIMER' } })
    fireEvent.click(screen.getByText('Confirmer la suppression'))

    await waitFor(() => {
      expect(screen.getByText('Impossible de contacter le serveur. Veuillez réessayer.')).toBeInTheDocument()
    })
  })

  it('should show confirmation instruction text', () => {
    render(<DeleteAccountDialog />)
    fireEvent.click(screen.getByText('Supprimer mon compte'))

    expect(screen.getByText('SUPPRIMER', { selector: 'span' })).toBeInTheDocument()
  })
})
