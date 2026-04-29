import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import type { User } from '@supabase/supabase-js'

// next/navigation is the only thing the page touches at module level via Suspense.
const replaceMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(''),
}))

// Mocks that the underlying drawers / photo store reach for in jsdom
vi.mock('maplibre-gl', () => ({ default: { Map: vi.fn() } }))
vi.mock('@/lib/hooks/use-theme', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light' as const, setTheme: vi.fn() }),
}))
vi.mock('@/lib/db/draft-photo-store', () => ({
  savePhoto: vi.fn().mockResolvedValue(undefined),
  loadPhoto: vi.fn().mockResolvedValue(null),
  deletePhoto: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/feedback', () => ({
  triggerTickFeedback: vi.fn(),
  showDraftSavedToast: vi.fn(),
  showDraftErrorToast: vi.fn(),
}))

const { default: ContributionsPage } = await import(
  '@/app/(auth)/profil/contributions/page'
)

const mockUser = {
  id: 'user-1',
  email: 'test@bleau.fr',
  user_metadata: { full_name: 'Test User' },
  created_at: '2026-01-01T00:00:00Z',
} as unknown as User

describe('ContributionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBoulderDraftStore.setState({ drafts: [] })
    useVideoSubmissionStore.setState({ submissions: [] })
  })

  it('shows loading spinner when auth is loading', () => {
    useAuthStore.setState({ user: null, isLoading: true })
    const { container } = render(<ContributionsPage />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders nothing when user is null', () => {
    useAuthStore.setState({ user: null, isLoading: false })
    const { container } = render(<ContributionsPage />)
    expect(container.innerHTML).toBe('')
  })

  it('shows the global header with the back link to /profil', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ContributionsPage />)
    expect(screen.getByText('Mes contributions')).toBeDefined()
    expect(
      screen.getByText('Vos créations de blocs et vidéos soumises'),
    ).toBeDefined()
    const back = screen.getByRole('link', { name: /Retour au profil/ })
    expect(back.getAttribute('href')).toBe('/profil')
  })

  it('renders both tabs with counters', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ContributionsPage />)
    expect(screen.getByTestId('tab-boulders')).toBeDefined()
    expect(screen.getByTestId('tab-media')).toBeDefined()
  })

  it('shows the empty state on the boulders tab when no drafts', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ContributionsPage />)
    expect(screen.getByTestId('boulders-empty')).toBeDefined()
    expect(screen.getByText('Aucune création de bloc')).toBeDefined()
  })

  it('shows the empty state on the media tab when no videos', () => {
    useAuthStore.setState({ user: mockUser, isLoading: false })
    render(<ContributionsPage />)
    fireEvent.click(screen.getByTestId('tab-media'))
    expect(screen.getByTestId('media-empty')).toBeDefined()
    expect(screen.getByText('Aucun média')).toBeDefined()
  })

  describe('with contribution data', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: mockUser, isLoading: false })

      useBoulderDraftStore.setState({
        drafts: [
          {
            id: 'draft-1',
            name: 'Le Test Bloc',
            grade: '6a',
            style: 'dalle',
            sector: 'Cul de Chien',
            description: '',
            height: null,
            exposure: null,
            strollerAccessible: false,
            photoBlurHash: null,
            photoWidth: null,
            photoHeight: null,
            latitude: null,
            longitude: null,
            topoDrawing: null,
            videoUrl: null,
            potentialDuplicate: false,
            syncStatus: 'local',
            status: 'pending',
            createdAt: '2026-04-10T10:00:00Z',
            updatedAt: '2026-04-10T10:00:00Z',
          },
          {
            id: 'draft-2',
            name: 'Bloc Approuvé',
            grade: '7a',
            style: 'devers',
            sector: 'Bas Cuvier',
            description: '',
            height: null,
            exposure: null,
            strollerAccessible: false,
            photoBlurHash: null,
            photoWidth: null,
            photoHeight: null,
            latitude: null,
            longitude: null,
            topoDrawing: null,
            videoUrl: null,
            potentialDuplicate: false,
            syncStatus: 'synced',
            status: 'approved',
            createdAt: '2026-04-12T10:00:00Z',
            updatedAt: '2026-04-12T10:00:00Z',
          },
        ],
      })

      useVideoSubmissionStore.setState({
        submissions: [
          {
            id: 'video-1',
            boulderId: 'b-1',
            videoUrl: 'https://www.youtube.com/watch?v=abc123',
            climberName: 'Marie',
            videographerName: null,
            moderationStatus: 'pending',
            syncStatus: 'local',
            userId: 'user-1',
            createdAt: '2026-04-15T10:00:00Z',
            updatedAt: '2026-04-15T10:00:00Z',
          },
        ],
      })
    })

    it('renders the list of drafts on the boulders tab', () => {
      render(<ContributionsPage />)
      expect(screen.getByText('Le Test Bloc')).toBeDefined()
      expect(screen.getByText('Bloc Approuvé')).toBeDefined()
    })

    it('shows the En ligne and En attente status pills', () => {
      render(<ContributionsPage />)
      // Approved -> En ligne
      expect(screen.getByTestId('status-pill-online')).toBeDefined()
      // Pending -> En attente
      expect(screen.getAllByTestId('status-pill-pending').length).toBeGreaterThan(
        0,
      )
    })

    it('switches to the media tab and lists video submissions', () => {
      render(<ContributionsPage />)
      fireEvent.click(screen.getByTestId('tab-media'))
      // Boulder lookup falls back to id when boulder not in mock data
      expect(screen.getByText('Marie')).toBeDefined()
    })

    it('opens the soft-delete dialog when deleting an approved draft', () => {
      render(<ContributionsPage />)
      fireEvent.click(
        screen.getByLabelText('Supprimer le bloc Bloc Approuvé'),
      )
      expect(screen.getByTestId('contribution-delete-dialog')).toBeDefined()
      // Online entries get the moderation message
      expect(
        screen.getByText(/équipe\s+de\s+modération/),
      ).toBeDefined()
    })

    it('immediately removes a non-approved draft on confirm', () => {
      render(<ContributionsPage />)
      fireEvent.click(screen.getByLabelText('Supprimer le bloc Le Test Bloc'))
      fireEvent.click(screen.getByTestId('contribution-delete-confirm'))
      expect(useBoulderDraftStore.getState().drafts).toHaveLength(1)
      expect(useBoulderDraftStore.getState().drafts[0].id).toBe('draft-2')
    })

    it('flags the approved draft as pendingDeletion on confirm', () => {
      render(<ContributionsPage />)
      fireEvent.click(screen.getByLabelText('Supprimer le bloc Bloc Approuvé'))
      fireEvent.click(screen.getByTestId('contribution-delete-confirm'))
      const draft = useBoulderDraftStore
        .getState()
        .drafts.find((d) => d.id === 'draft-2')
      expect(draft?.pendingDeletion).toBe(true)
    })
  })
})
