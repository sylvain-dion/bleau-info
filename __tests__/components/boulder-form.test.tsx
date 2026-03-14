import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BoulderForm } from '@/components/boulder/boulder-form'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'

vi.mock('@/lib/feedback', () => ({
  triggerTickFeedback: vi.fn(),
}))

vi.mock('@/lib/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    resolvedTheme: 'light' as const,
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/components/boulder/location-picker', () => ({
  LocationPicker: vi.fn(() => null),
}))

vi.mock('@/components/topo/topo-trace-editor', () => ({
  TopoTraceEditor: vi.fn(() => null),
}))

describe('BoulderForm', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useBoulderDraftStore.setState({ drafts: [] })
  })

  it('should render form with all fields', () => {
    render(<BoulderForm {...defaultProps} />)

    expect(screen.getByText('Nouveau bloc')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nom/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cotation/)).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /style de grimpe/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Secteur/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hauteur/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Exposition/)).toBeInTheDocument()
    expect(screen.getByText('Accessible poussette')).toBeInTheDocument()
    expect(screen.getByText('Créer le bloc')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('should render all 6 style chips', () => {
    render(<BoulderForm {...defaultProps} />)

    expect(screen.getByText('Dalle')).toBeInTheDocument()
    expect(screen.getByText('Dévers')).toBeInTheDocument()
    expect(screen.getByText('Toit')).toBeInTheDocument()
    expect(screen.getByText('Arête')).toBeInTheDocument()
    expect(screen.getByText('Traversée')).toBeInTheDocument()
    expect(screen.getByText('Bloc')).toBeInTheDocument()

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(6)
  })

  it('should render grade dropdown with all grades', () => {
    render(<BoulderForm {...defaultProps} />)

    const gradeSelect = screen.getByLabelText(/Cotation/) as HTMLSelectElement
    // 26 grades in GRADE_SCALE + 1 placeholder option
    expect(gradeSelect.options.length).toBe(27)
    expect(gradeSelect.options[0].value).toBe('')
    expect(gradeSelect.options[1].value).toBe('3a')
  })

  it('should render sector dropdown with mock sectors', () => {
    render(<BoulderForm {...defaultProps} />)

    const sectorSelect = screen.getByLabelText(/Secteur/) as HTMLSelectElement
    // 6 mock sectors + 1 placeholder
    expect(sectorSelect.options.length).toBe(7)
  })

  it('should call onClose when cancel is clicked', () => {
    render(<BoulderForm {...defaultProps} />)
    fireEvent.click(screen.getByText('Annuler'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when X button is clicked', () => {
    render(<BoulderForm {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should show validation errors when submitting empty form', async () => {
    render(<BoulderForm {...defaultProps} />)
    fireEvent.click(screen.getByText('Créer le bloc'))

    await waitFor(() => {
      const errors = document.querySelectorAll('.text-destructive')
      // At least name, grade, and style errors
      expect(errors.length).toBeGreaterThanOrEqual(3)
    })

    expect(useBoulderDraftStore.getState().drafts).toHaveLength(0)
  })

  it('should submit form with valid required data', async () => {
    const { triggerTickFeedback } = await import('@/lib/feedback')

    render(<BoulderForm {...defaultProps} />)

    // Fill name
    fireEvent.change(screen.getByLabelText(/Nom/), {
      target: { value: 'Le Test Bloc' },
    })

    // Select grade
    fireEvent.change(screen.getByLabelText(/Cotation/), {
      target: { value: '6a' },
    })

    // Select style
    fireEvent.click(screen.getByText('Dalle'))

    // Submit
    fireEvent.click(screen.getByText('Créer le bloc'))

    await waitFor(() => {
      const drafts = useBoulderDraftStore.getState().drafts
      expect(drafts).toHaveLength(1)
      expect(drafts[0].name).toBe('Le Test Bloc')
      expect(drafts[0].grade).toBe('6a')
      expect(drafts[0].style).toBe('dalle')
      expect(drafts[0].status).toBe('draft')
    })

    expect(triggerTickFeedback).toHaveBeenCalledTimes(1)
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
  })

  it('should submit form with all optional fields', async () => {
    render(<BoulderForm {...defaultProps} />)

    // Required fields
    fireEvent.change(screen.getByLabelText(/Nom/), {
      target: { value: 'Bloc Complet' },
    })
    fireEvent.change(screen.getByLabelText(/Cotation/), {
      target: { value: '7a+' },
    })
    fireEvent.click(screen.getByText('Toit'))

    // Optional fields
    fireEvent.change(screen.getByLabelText(/Secteur/), {
      target: { value: 'Bas Cuvier' },
    })
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: 'Un toit très physique' },
    })
    fireEvent.change(screen.getByLabelText(/Hauteur/), {
      target: { value: '4.5' },
    })
    fireEvent.change(screen.getByLabelText(/Exposition/), {
      target: { value: 'ombre' },
    })
    fireEvent.click(screen.getByText('Accessible poussette'))

    fireEvent.click(screen.getByText('Créer le bloc'))

    await waitFor(() => {
      const drafts = useBoulderDraftStore.getState().drafts
      expect(drafts).toHaveLength(1)
      expect(drafts[0].sector).toBe('Bas Cuvier')
      expect(drafts[0].description).toBe('Un toit très physique')
      expect(drafts[0].height).toBe(4.5)
      expect(drafts[0].exposure).toBe('ombre')
      expect(drafts[0].strollerAccessible).toBe(true)
    })
  })

  it('should mark required fields with asterisk', () => {
    render(<BoulderForm {...defaultProps} />)

    // Required fields have * marker
    const requiredMarkers = document.querySelectorAll('.text-destructive')
    // Name *, Cotation *, Style * (rendered inside BoulderStyleSelector)
    expect(requiredMarkers.length).toBeGreaterThanOrEqual(2)
  })

  describe('edit mode', () => {
    it('should show edit header and button when editDraftId is provided', () => {
      const id = useBoulderDraftStore.getState().addDraft({
        name: 'Existing Bloc',
        grade: '6a',
        style: 'dalle',
        sector: 'Bas Cuvier',
        description: 'Un classique',
        height: 3.5,
        exposure: 'soleil',
        strollerAccessible: true,
        photoBlurHash: null,
        photoWidth: null,
        photoHeight: null,
        latitude: null,
        longitude: null,
        topoDrawing: null,
      })

      render(<BoulderForm {...defaultProps} editDraftId={id} />)

      expect(screen.getByText('Modifier le brouillon')).toBeInTheDocument()
      expect(screen.getByText('Enregistrer')).toBeInTheDocument()
      expect(screen.queryByText('Nouveau bloc')).not.toBeInTheDocument()
      expect(screen.queryByText('Créer le bloc')).not.toBeInTheDocument()
    })

    it('should pre-fill form with existing draft data', () => {
      const id = useBoulderDraftStore.getState().addDraft({
        name: 'Existing Bloc',
        grade: '6a',
        style: 'dalle',
        sector: 'Bas Cuvier',
        description: 'Un classique',
        height: 3.5,
        exposure: 'soleil',
        strollerAccessible: true,
        photoBlurHash: null,
        photoWidth: null,
        photoHeight: null,
        latitude: null,
        longitude: null,
        topoDrawing: null,
      })

      render(<BoulderForm {...defaultProps} editDraftId={id} />)

      expect(screen.getByLabelText(/Nom/)).toHaveValue('Existing Bloc')
      expect(screen.getByLabelText(/Cotation/)).toHaveValue('6a')
      expect(screen.getByLabelText(/Secteur/)).toHaveValue('Bas Cuvier')
      expect(screen.getByLabelText(/Description/)).toHaveValue('Un classique')
      expect(screen.getByLabelText(/Hauteur/)).toHaveValue(3.5)
      expect(screen.getByLabelText(/Exposition/)).toHaveValue('soleil')
    })

    it('should update existing draft on submit instead of creating new', async () => {
      const id = useBoulderDraftStore.getState().addDraft({
        name: 'Original Name',
        grade: '5a',
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

      render(<BoulderForm {...defaultProps} editDraftId={id} />)

      // Change the name
      fireEvent.change(screen.getByLabelText(/Nom/), {
        target: { value: 'Updated Name' },
      })

      fireEvent.click(screen.getByText('Enregistrer'))

      await waitFor(() => {
        const drafts = useBoulderDraftStore.getState().drafts
        expect(drafts).toHaveLength(1) // no new draft created
        expect(drafts[0].name).toBe('Updated Name')
        expect(drafts[0].id).toBe(id) // same ID
      })
    })
  })

  it('should have accessible form structure', () => {
    render(<BoulderForm {...defaultProps} />)

    // Form should have labeled inputs
    expect(screen.getByLabelText(/Nom/)).toHaveAttribute('id', 'boulder-name')
    expect(screen.getByLabelText(/Cotation/)).toHaveAttribute('id', 'boulder-grade')
    expect(screen.getByLabelText(/Description/)).toHaveAttribute('id', 'boulder-description')
    expect(screen.getByLabelText(/Hauteur/)).toHaveAttribute('id', 'boulder-height')
    expect(screen.getByLabelText(/Exposition/)).toHaveAttribute('id', 'boulder-exposure')

    // Close button should have aria-label
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  describe('location (Story 5.3)', () => {
    it('should render location button', () => {
      render(<BoulderForm {...defaultProps} />)

      expect(screen.getByText('Localiser le bloc')).toBeInTheDocument()
    })

    it('should render location label', () => {
      render(<BoulderForm {...defaultProps} />)

      expect(screen.getByText('Localisation')).toBeInTheDocument()
    })

    it('should save coordinates in draft on submit', async () => {
      const { triggerTickFeedback } = await import('@/lib/feedback')
      const { LocationPicker } = await import('@/components/boulder/location-picker')

      // Make LocationPicker render a confirm button that triggers onConfirm
      vi.mocked(LocationPicker).mockImplementation(({ onConfirm }: { onConfirm: (coords: { latitude: number; longitude: number }) => void }) => (
        <button type="button" onClick={() => onConfirm({ latitude: 48.382619, longitude: 2.634521 })}>
          mock-confirm
        </button>
      ))

      render(<BoulderForm {...defaultProps} />)

      // Open location picker — renders lazy-loaded mock button
      fireEvent.click(screen.getByText('Localiser le bloc'))

      // Wait for lazy component to resolve
      await waitFor(() => {
        expect(screen.getByText('mock-confirm')).toBeInTheDocument()
      })

      // Click mock confirm to set coordinates
      fireEvent.click(screen.getByText('mock-confirm'))

      // Coordinates should now be set — verify UI shows them
      expect(screen.getByText('Position définie')).toBeInTheDocument()

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Nom/), {
        target: { value: 'Bloc GPS' },
      })
      fireEvent.change(screen.getByLabelText(/Cotation/), {
        target: { value: '6a' },
      })
      fireEvent.click(screen.getByText('Dalle'))

      fireEvent.click(screen.getByText('Créer le bloc'))

      await waitFor(() => {
        const drafts = useBoulderDraftStore.getState().drafts
        expect(drafts).toHaveLength(1)
        expect(drafts[0].latitude).toBe(48.382619)
        expect(drafts[0].longitude).toBe(2.634521)
      })

      expect(triggerTickFeedback).toHaveBeenCalledTimes(1)
    })

    it('should submit null coordinates when no location set', async () => {
      render(<BoulderForm {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Nom/), {
        target: { value: 'Bloc Sans GPS' },
      })
      fireEvent.change(screen.getByLabelText(/Cotation/), {
        target: { value: '5a' },
      })
      fireEvent.click(screen.getByText('Dalle'))

      fireEvent.click(screen.getByText('Créer le bloc'))

      await waitFor(() => {
        const drafts = useBoulderDraftStore.getState().drafts
        expect(drafts).toHaveLength(1)
        expect(drafts[0].latitude).toBeNull()
        expect(drafts[0].longitude).toBeNull()
      })
    })
  })

  describe('topo trace (Story 5.4)', () => {
    it('should render trace button', () => {
      render(<BoulderForm {...defaultProps} />)

      expect(screen.getByText('Dessiner le tracé')).toBeInTheDocument()
    })

    it('should render trace label', () => {
      render(<BoulderForm {...defaultProps} />)

      expect(screen.getByText('Tracé')).toBeInTheDocument()
    })

    it('should disable trace button when no photo is uploaded', () => {
      render(<BoulderForm {...defaultProps} />)

      const traceButton = screen.getByText('Dessiner le tracé')
      expect(traceButton).toBeDisabled()
    })

    it('should show hint text when no photo', () => {
      render(<BoulderForm {...defaultProps} />)

      expect(screen.getByText('Ajoutez une photo pour dessiner le tracé')).toBeInTheDocument()
    })

    it('should submit null topoDrawing when no trace drawn', async () => {
      render(<BoulderForm {...defaultProps} />)

      fireEvent.change(screen.getByLabelText(/Nom/), {
        target: { value: 'Bloc Sans Tracé' },
      })
      fireEvent.change(screen.getByLabelText(/Cotation/), {
        target: { value: '5a' },
      })
      fireEvent.click(screen.getByText('Dalle'))

      fireEvent.click(screen.getByText('Créer le bloc'))

      await waitFor(() => {
        const drafts = useBoulderDraftStore.getState().drafts
        expect(drafts).toHaveLength(1)
        expect(drafts[0].topoDrawing).toBeNull()
      })
    })
  })
})
