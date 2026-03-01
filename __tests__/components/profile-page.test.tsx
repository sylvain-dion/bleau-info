import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@supabase/supabase-js'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }),
}))

// Must import after mocks
const { default: ProfilPage } = await import('@/app/(auth)/profil/page')

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2026-01-15T10:00:00Z',
  user_metadata: {
    display_name: 'Jean Grimpeur',
    full_name: 'Jean Grimpeur',
    max_grade: '6a+',
    avatar_preset: 'climber',
  },
} as unknown as User

describe('ProfilPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading spinner when auth is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true })
    const { container } = render(<ProfilPage />)

    // Check for spinner (animated element)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should render profile page for authenticated user', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    expect(screen.getByText('Mon Profil')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('should display the display name input with user data', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    const nameInput = screen.getByLabelText("Nom d'affichage")
    expect(nameInput).toHaveValue('Jean Grimpeur')
  })

  it('should display the grade select with user data', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    const gradeSelect = screen.getByLabelText('Niveau max à vue')
    expect(gradeSelect).toHaveValue('6a+')
  })

  it('should display avatar picker', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    expect(screen.getByRole('radiogroup', { name: "Choix d'avatar" })).toBeInTheDocument()
  })

  it('should display profile stats', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    expect(screen.getByText('Croix')).toBeInTheDocument()
    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('Membre depuis')).toBeInTheDocument()
  })

  it('should display member since date formatted in French', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    // January 2026 in French
    expect(screen.getByText('janvier 2026')).toBeInTheDocument()
  })

  it('should display zero stats as placeholders', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    // Both tick count and contribution points should be 0
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(2)
  })

  it('should render Enregistrer button', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    expect(screen.getByText('Enregistrer')).toBeInTheDocument()
  })

  it('should disable submit button when form is not dirty', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    const submitButton = screen.getByText('Enregistrer').closest('button')
    expect(submitButton).toBeDisabled()
  })

  it('should render grade options from GRADE_SCALE', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ProfilPage />)

    const gradeSelect = screen.getByLabelText('Niveau max à vue')
    expect(gradeSelect.querySelectorAll('option').length).toBeGreaterThan(20) // 26 grades + "Non défini"
  })
})
