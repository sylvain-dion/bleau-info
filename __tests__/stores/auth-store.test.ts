import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
} as User

describe('Auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true })
  })

  it('should initialize with null user and loading true', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isLoading).toBe(true)
  })

  it('should set user', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('should clear user by setting null', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('should update loading and user independently', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setLoading(false)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isLoading).toBe(false)
  })
})
