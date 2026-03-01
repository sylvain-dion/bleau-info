import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AuthListener } from '@/components/auth/auth-listener'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
} as User

const mockUnsubscribe = vi.fn()
let authStateCallback: ((event: string, session: { user: User } | null) => void) | null = null

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: mockUser },
  error: null,
})

const mockOnAuthStateChange = vi.fn().mockImplementation((callback) => {
  authStateCallback = callback
  return {
    data: {
      subscription: {
        unsubscribe: mockUnsubscribe,
      },
    },
  }
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

describe('AuthListener', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authStateCallback = null
    useAuthStore.setState({ user: null, isLoading: true })
  })

  afterEach(() => {
    authStateCallback = null
  })

  it('should call getUser on mount', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledTimes(1)
    })
  })

  it('should set user from getUser result', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockUser)
    })
  })

  it('should set loading to false after getUser', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  it('should subscribe to onAuthStateChange', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
    })
  })

  it('should update user on auth state change', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(authStateCallback).not.toBeNull()
    })

    const newUser = { id: 'user-456', email: 'new@example.com' } as User
    authStateCallback!('SIGNED_IN', { user: newUser })

    expect(useAuthStore.getState().user).toEqual(newUser)
  })

  it('should clear user on sign out event', async () => {
    render(<AuthListener />)

    await waitFor(() => {
      expect(authStateCallback).not.toBeNull()
    })

    authStateCallback!('SIGNED_OUT', null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should unsubscribe on unmount', async () => {
    const { unmount } = render(<AuthListener />)

    await waitFor(() => {
      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('should handle getUser returning null user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    render(<AuthListener />)

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
