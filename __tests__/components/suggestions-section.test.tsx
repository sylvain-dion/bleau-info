import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuggestionsSection } from '@/components/profile/suggestions-section'
import { useSuggestionStore } from '@/stores/suggestion-store'
import type { BoulderSuggestionInput } from '@/stores/suggestion-store'

vi.mock('@/lib/db/draft-photo-store', () => ({
  savePhoto: vi.fn().mockResolvedValue(undefined),
  loadPhoto: vi.fn().mockResolvedValue(null),
  deletePhoto: vi.fn().mockResolvedValue(undefined),
}))

/** Minimal valid suggestion input for reuse across tests. */
const validInput: BoulderSuggestionInput = {
  originalBoulderId: 'cul-de-chien-1',
  originalSnapshot: {
    name: 'La Marie-Rose',
    grade: '6a',
    style: 'dalle',
    sector: 'Cul de Chien',
    exposure: 'soleil',
    strollerAccessible: false,
    latitude: 48.3815,
    longitude: 2.6345,
  },
  name: 'La Marie-Rose',
  grade: '6a+',
  style: 'dalle',
  sector: 'Cul de Chien',
  description: '',
  height: null,
  exposure: 'soleil',
  strollerAccessible: false,
  photoBlurHash: null,
  photoWidth: null,
  photoHeight: null,
  latitude: 48.3815,
  longitude: 2.6345,
  topoDrawing: null,
}

describe('SuggestionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSuggestionStore.setState({ suggestions: [] })
  })

  it('should render nothing when no suggestions exist', () => {
    const { container } = render(<SuggestionsSection />)
    expect(container.firstChild).toBeNull()
  })

  it('should render suggestions list when suggestions exist', () => {
    useSuggestionStore.getState().addSuggestion(validInput)

    render(<SuggestionsSection />)

    expect(screen.getByText('Mes suggestions')).toBeInTheDocument()
    expect(screen.getByText('La Marie-Rose')).toBeInTheDocument()
    expect(screen.getByText('6A+')).toBeInTheDocument() // formatted grade
    expect(screen.getByText(/Modification de La Marie-Rose/)).toBeInTheDocument()
  })

  it('should show suggestion count badge', () => {
    useSuggestionStore.getState().addSuggestion(validInput)
    useSuggestionStore.getState().addSuggestion({
      ...validInput,
      name: 'Autre Bloc',
      grade: '7a',
    })

    render(<SuggestionsSection />)

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should show pending moderation status pill', () => {
    useSuggestionStore.getState().addSuggestion(validInput)

    render(<SuggestionsSection />)

    const pill = screen.getByTestId('moderation-status-pill')
    expect(pill).toHaveTextContent('En attente')
  })

  it('should remove suggestion when delete button is clicked', async () => {
    const user = userEvent.setup()

    useSuggestionStore.getState().addSuggestion(validInput)

    render(<SuggestionsSection />)

    expect(screen.getByText('La Marie-Rose')).toBeInTheDocument()

    const deleteBtn = screen.getByLabelText('Supprimer la suggestion La Marie-Rose')
    await user.click(deleteBtn)

    expect(useSuggestionStore.getState().suggestions).toHaveLength(0)
  })

  it('should call deletePhoto when removing a suggestion', async () => {
    const user = userEvent.setup()
    const { deletePhoto } = await import('@/lib/db/draft-photo-store')

    useSuggestionStore.getState().addSuggestion({
      ...validInput,
      photoBlurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      photoWidth: 1200,
      photoHeight: 800,
    })

    render(<SuggestionsSection />)

    const deleteBtn = screen.getByLabelText('Supprimer la suggestion La Marie-Rose')
    await user.click(deleteBtn)

    expect(useSuggestionStore.getState().suggestions).toHaveLength(0)
    expect(deletePhoto).toHaveBeenCalledTimes(1)
  })

  it('should show approved moderation status', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    // Manually set moderationStatus to approved
    useSuggestionStore.setState((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, moderationStatus: 'approved' as const } : s
      ),
    }))

    render(<SuggestionsSection />)

    expect(screen.getByText('Approuvée')).toBeInTheDocument()
  })

  it('should show rejected moderation status', () => {
    const id = useSuggestionStore.getState().addSuggestion(validInput)

    // Manually set moderationStatus to rejected
    useSuggestionStore.setState((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, moderationStatus: 'rejected' as const } : s
      ),
    }))

    render(<SuggestionsSection />)

    expect(screen.getByText('Rejetée')).toBeInTheDocument()
  })
})
