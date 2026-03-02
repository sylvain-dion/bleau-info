import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddToListMenu } from '@/components/boulder/add-to-list-menu'
import { useListStore } from '@/stores/list-store'

/** Reset list store before each test */
function resetStore() {
  useListStore.setState({ lists: [] })
}

describe('AddToListMenu', () => {
  const defaultProps = {
    boulderId: 'boulder-42',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AddToListMenu {...defaultProps} isOpen={false} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the menu when isOpen is true', () => {
    render(<AddToListMenu {...defaultProps} />)
    expect(screen.getByText('Mes listes')).toBeInTheDocument()
    expect(screen.getByText('Créer une nouvelle liste')).toBeInTheDocument()
  })

  it('shows "Aucune liste créée" when no lists exist', () => {
    render(<AddToListMenu {...defaultProps} />)
    expect(screen.getByText('Aucune liste créée')).toBeInTheDocument()
  })

  it('displays existing lists with their names', () => {
    useListStore.getState().createList('Projets', '🎯')
    useListStore.getState().createList('Favoris', '⭐')

    render(<AddToListMenu {...defaultProps} />)
    expect(screen.getByText('Projets')).toBeInTheDocument()
    expect(screen.getByText('Favoris')).toBeInTheDocument()
  })

  it('toggles boulder in a list on click', () => {
    const listId = useListStore.getState().createList('Projets', '🎯')

    render(<AddToListMenu {...defaultProps} />)

    // Click to add
    fireEvent.click(screen.getByText('Projets'))
    expect(useListStore.getState().getList(listId)?.items).toHaveLength(1)

    // Click again to remove
    fireEvent.click(screen.getByText('Projets'))
    expect(useListStore.getState().getList(listId)?.items).toHaveLength(0)
  })

  it('shows create form when clicking "Créer une nouvelle liste"', () => {
    render(<AddToListMenu {...defaultProps} />)

    fireEvent.click(screen.getByText('Créer une nouvelle liste'))
    expect(screen.getByPlaceholderText('Nom de la liste')).toBeInTheDocument()
  })

  it('creates a new list and adds boulder via inline form', () => {
    render(<AddToListMenu {...defaultProps} />)

    // Open create form
    fireEvent.click(screen.getByText('Créer une nouvelle liste'))

    // Fill in name
    const input = screen.getByPlaceholderText('Nom de la liste')
    fireEvent.change(input, { target: { value: 'Ma Nouvelle Liste' } })

    // Submit
    fireEvent.click(screen.getByText('Créer'))

    // Verify list was created with boulder
    const lists = useListStore.getState().lists
    expect(lists).toHaveLength(1)
    expect(lists[0].name).toBe('Ma Nouvelle Liste')
    expect(lists[0].items).toHaveLength(1)
    expect(lists[0].items[0].boulderId).toBe('boulder-42')
  })

  it('shows validation error for empty list name', () => {
    render(<AddToListMenu {...defaultProps} />)

    fireEvent.click(screen.getByText('Créer une nouvelle liste'))

    // Submit empty
    fireEvent.click(screen.getByText('Créer'))
    expect(screen.getByText('Le nom est requis')).toBeInTheDocument()
  })

  it('calls onClose when clicking the close button', () => {
    render(<AddToListMenu {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Fermer'))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })
})
