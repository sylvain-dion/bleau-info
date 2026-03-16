import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import { VideoCarousel } from '@/components/boulder/video-carousel'

const emptyArray: never[] = []

// Mock stores
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const state = { user: null }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/stores/video-submission-store', () => ({
  useVideoSubmissionStore: vi.fn((selector: (s: unknown) => unknown) => {
    const state = {
      submissions: emptyArray,
      getSubmissionsForBoulder: () => emptyArray,
      getSubmissionsForUser: () => emptyArray,
      addSubmission: vi.fn(),
      updateSubmission: vi.fn(),
      getSubmission: () => undefined,
      getUniqueClimberNames: () => emptyArray,
      getUniqueVideographerNames: () => emptyArray,
      removeSubmission: vi.fn(),
    }
    return selector(state)
  }),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock vaul Drawer — don't render children when closed
vi.mock('vaul', () => ({
  Drawer: {
    Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div>{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Overlay: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Title: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  },
}))

const mockedUseAuthStore = vi.mocked(useAuthStore)

function setUser(user: { id: string } | null) {
  mockedUseAuthStore.mockImplementation((selector?: (s: unknown) => unknown) => {
    const state = { user }
    return selector ? selector(state) : state
  })
}

describe('VideoCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setUser(null)
  })

  it('renders mock videos as cards', () => {
    const mockVideos = [
      { videoUrl: 'https://www.youtube.com/watch?v=abc123', climberName: 'Jacky Godoffe' },
      { videoUrl: 'https://vimeo.com/456789', videographerName: 'Pierre Vidal' },
    ]

    render(<VideoCarousel boulderId="test-1" mockVideos={mockVideos} />)

    expect(screen.getByText('Jacky Godoffe')).toBeInTheDocument()
    expect(screen.getByText('Pierre Vidal')).toBeInTheDocument()
  })

  it('shows plural heading for multiple videos', () => {
    const mockVideos = [
      { videoUrl: 'https://www.youtube.com/watch?v=abc' },
      { videoUrl: 'https://www.youtube.com/watch?v=def' },
    ]

    render(<VideoCarousel boulderId="test-1" mockVideos={mockVideos} />)

    expect(screen.getByText('Vidéos')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('shows login redirect for non-authenticated users', () => {
    render(<VideoCarousel boulderId="test-1" mockVideos={[{ videoUrl: 'https://youtube.com/watch?v=x' }]} />)

    expect(
      screen.getByText('Connectez-vous pour ajouter une vidéo')
    ).toBeInTheDocument()
  })

  it('shows "Ajouter une vidéo" for authenticated users', () => {
    setUser({ id: 'user-1' })

    render(<VideoCarousel boulderId="test-1" mockVideos={[{ videoUrl: 'https://youtube.com/watch?v=x' }]} />)

    expect(screen.getByText('Ajouter une vidéo')).toBeInTheDocument()
  })

  it('returns null when no videos and not authenticated', () => {
    const { container } = render(<VideoCarousel boulderId="test-1" />)

    expect(container.innerHTML).toBe('')
  })
})
