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

describe('BoulderDraftsSection', () => {
  beforeEach(() => {
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByText('Mes brouillons de blocs')).toBeInTheDocument()
    expect(screen.getByText('Le Test Bloc')).toBeInTheDocument()
    expect(screen.getByText('6A')).toBeInTheDocument() // formatted grade
    expect(screen.getByText(/Dalle/)).toBeInTheDocument()
    expect(screen.getByText(/Cul de Chien/)).toBeInTheDocument()
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
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
    })

    render(<BoulderDraftsSection />)

    expect(screen.getByLabelText('Modifier le brouillon Bloc Éditable')).toBeInTheDocument()
  })

  it('should show pending status for pending drafts', () => {
    const id = useBoulderDraftStore.getState().addDraft({
      name: 'En Attente',
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
    })

    // Manually set status to pending
    useBoulderDraftStore.getState().updateDraft(id, {} as never)
    useBoulderDraftStore.setState((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === id ? { ...d, status: 'pending' as const } : d
      ),
    }))

    render(<BoulderDraftsSection />)

    expect(screen.getByText('En attente')).toBeInTheDocument()
  })
})
