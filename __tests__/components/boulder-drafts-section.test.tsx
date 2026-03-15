import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoulderDraftsSection } from '@/components/profile/boulder-drafts-section'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'

// Mock maplibre-gl (no WebGL in jsdom) — pulled in via BoulderForm → LocationPicker
vi.mock('maplibre-gl', () => ({
  default: { Map: vi.fn() },
}))

vi.mock('@/lib/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light' as const,
    setTheme: vi.fn(),
  }),
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

describe('BoulderDraftsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBoulderDraftStore.setState({ drafts: [] })
  })

  it('should render nothing when no drafts exist', () => {
    const { container } = render(<BoulderDraftsSection />)
    expect(container.firstChild).toBeNull()
  })

  it('should render drafts list when drafts exist', () => {
    useBoulderDraftStore.getState().addDraft({
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByText('Mes brouillons de blocs')).toBeInTheDocument()
    expect(screen.getByText('Le Test Bloc')).toBeInTheDocument()
    expect(screen.getByText('6A')).toBeInTheDocument() // formatted grade
    expect(screen.getByText(/Dalle/)).toBeInTheDocument()
    expect(screen.getByText(/Cul de Chien/)).toBeInTheDocument()
    expect(screen.getByText('Local')).toBeInTheDocument()
  })

  it('should show draft count badge', () => {
    useBoulderDraftStore.getState().addDraft({
      name: 'Bloc A',
      grade: '5c',
      style: 'devers',
      sector: '',
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
    })
    useBoulderDraftStore.getState().addDraft({
      name: 'Bloc B',
      grade: '7a',
      style: 'toit',
      sector: '',
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should remove draft when delete button is clicked', async () => {
    const user = userEvent.setup()

    useBoulderDraftStore.getState().addDraft({
      name: 'Bloc à Supprimer',
      grade: '4a',
      style: 'bloc',
      sector: '',
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByText('Bloc à Supprimer')).toBeInTheDocument()

    const deleteBtn = screen.getByLabelText('Supprimer le brouillon Bloc à Supprimer')
    await user.click(deleteBtn)

    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should display style without sector when sector is empty', () => {
    useBoulderDraftStore.getState().addDraft({
      name: 'Sans Secteur',
      grade: '6b+',
      style: 'arete',
      sector: '',
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
    })

    render(<BoulderDraftsSection />)

    const detail = screen.getByText(/Arête/)
    expect(detail).toBeInTheDocument()
    // Should not contain a middle dot before sector since there's no sector
    expect(detail.textContent).not.toMatch(/Arête · [A-Z]/)
  })

  it('should render edit button for each draft', () => {
    useBoulderDraftStore.getState().addDraft({
      name: 'Bloc Éditable',
      grade: '6a',
      style: 'dalle',
      sector: '',
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByLabelText('Modifier le brouillon Bloc Éditable')).toBeInTheDocument()
  })

  it('should show sync status pill for each draft', () => {
    useBoulderDraftStore.getState().addDraft({
      name: 'Local Bloc',
      grade: '5a',
      style: 'traverse',
      sector: '',
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
    })

    render(<BoulderDraftsSection />)

    // Default syncStatus is 'local'
    const pill = screen.getByTestId('sync-status-pill')
    expect(pill).toHaveTextContent('Local')
  })

  it('should show pending sync status', () => {
    const id = useBoulderDraftStore.getState().addDraft({
      name: 'Pending Bloc',
      grade: '5a',
      style: 'traverse',
      sector: '',
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
    })

    // Manually set syncStatus to pending
    useBoulderDraftStore.setState((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === id ? { ...d, syncStatus: 'pending' as const } : d
      ),
    }))

    render(<BoulderDraftsSection />)

    expect(screen.getByText('En attente')).toBeInTheDocument()
  })

  it('should call deletePhoto when removing a draft', async () => {
    const user = userEvent.setup()
    const { deletePhoto } = await import('@/lib/db/draft-photo-store')

    useBoulderDraftStore.getState().addDraft({
      name: 'Bloc With Photo',
      grade: '4a',
      style: 'bloc',
      sector: '',
      description: '',
      height: null,
      exposure: null,
      strollerAccessible: false,
      photoBlurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      photoWidth: 1200,
      photoHeight: 800,
      latitude: null,
      longitude: null,
      topoDrawing: null,
    })

    render(<BoulderDraftsSection />)

    const deleteBtn = screen.getByLabelText('Supprimer le brouillon Bloc With Photo')
    await user.click(deleteBtn)

    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
    expect(deletePhoto).toHaveBeenCalledTimes(1)
  })
})
