import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserMenu } from '@/components/auth/user-menu'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Jean Dupont' },
} as unknown as User

const mockUserWithAvatar = {
  id: 'user-456',
  email: 'jane@example.com',
  user_metadata: {
    full_name: 'Jane Smith',
    avatar_url: 'https://example.com/avatar.jpg',
  },
} as unknown as User

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should render loading skeleton', () => {
      useAuthStore.setState({ user: null, isLoading: true })
      render(<UserMenu />)
      expect(screen.getByLabelText('Chargement du profil')).toBeDefined()
    })
  })

  describe('unauthenticated state', () => {
    it('should render login link', () => {
      useAuthStore.setState({ user: null, isLoading: false })
      render(<UserMenu />)
      const link = screen.getByLabelText('Se connecter')
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/login')
    })
  })

  describe('authenticated state', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: mockUser, isLoading: false })
    })

    it('should render user initials', () => {
      render(<UserMenu />)
      expect(screen.getByText('JD')).toBeDefined()
    })

    it('should render avatar image when available', () => {
      useAuthStore.setState({ user: mockUserWithAvatar, isLoading: false })
      render(<UserMenu />)
      const button = screen.getByLabelText('Menu utilisateur')
      const img = button.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg')
    })

    it('should open dropdown on click', () => {
      render(<UserMenu />)
      const button = screen.getByLabelText('Menu utilisateur')
      fireEvent.click(button)

      expect(screen.getByText('Jean Dupont')).toBeDefined()
      expect(screen.getByText('test@example.com')).toBeDefined()
      expect(screen.getByText('Se déconnecter')).toBeDefined()
    })

    it('should close dropdown on second click', () => {
      render(<UserMenu />)
      const button = screen.getByLabelText('Menu utilisateur')

      fireEvent.click(button)
      expect(screen.getByText('Se déconnecter')).toBeDefined()

      fireEvent.click(button)
      expect(screen.queryByText('Se déconnecter')).toBeNull()
    })

    it('should call signOut when clicking disconnect', async () => {
      render(<UserMenu />)
      const button = screen.getByLabelText('Menu utilisateur')
      fireEvent.click(button)

      const signOutButton = screen.getByText('Se déconnecter')
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })

    it('should close dropdown on Escape key', () => {
      render(<UserMenu />)
      const button = screen.getByLabelText('Menu utilisateur')
      fireEvent.click(button)

      expect(screen.getByText('Se déconnecter')).toBeDefined()

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByText('Se déconnecter')).toBeNull()
    })

    it('should show single initial for single-name user', () => {
      useAuthStore.setState({
        user: {
          id: 'user-789',
          email: 'mono@example.com',
          user_metadata: { full_name: 'Admin' },
        } as unknown as User,
        isLoading: false,
      })
      render(<UserMenu />)
      expect(screen.getByText('A')).toBeDefined()
    })

    it('should show email initial when no full_name', () => {
      useAuthStore.setState({
        user: {
          id: 'user-000',
          email: 'grimpeur@bleau.fr',
          user_metadata: {},
        } as unknown as User,
        isLoading: false,
      })
      render(<UserMenu />)
      expect(screen.getByText('G')).toBeDefined()
    })
  })
})
