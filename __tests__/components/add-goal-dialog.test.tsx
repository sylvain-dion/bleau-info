import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddGoalDialog } from '@/components/profile/add-goal-dialog'

describe('AddGoalDialog', () => {
  it('renders only the open-trigger button initially', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    expect(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the dialog when the trigger is clicked', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nouvel objectif')).toBeInTheDocument()
  })

  it('closes the dialog when the close button is clicked', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an inline error when target is empty on submit', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }))
    expect(screen.getByText(/Définissez/)).toBeInTheDocument()
  })

  it('rejects an invalid numeric target', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    const input = screen.getByPlaceholderText(/p. ex./i)
    fireEvent.change(input, { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }))
    expect(screen.getByText(/positive/i)).toBeInTheDocument()
  })

  it('calls onAdd with normalized values for a numeric goal', () => {
    const onAdd = vi.fn()
    render(<AddGoalDialog onAdd={onAdd} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    const input = screen.getByPlaceholderText(/p. ex./i)
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }))
    expect(onAdd).toHaveBeenCalledWith({
      type: 'tickCount',
      target: 50,
      deadline: null,
    })
  })

  it('switches to a grade dropdown when type=maxGrade', () => {
    render(<AddGoalDialog onAdd={() => {}} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    fireEvent.change(screen.getByLabelText(/^Type$/), {
      target: { value: 'maxGrade' },
    })
    expect(screen.queryByPlaceholderText(/p. ex./i)).not.toBeInTheDocument()
    expect(screen.getByText('Choisir un niveau…')).toBeInTheDocument()
  })

  it('passes a grade target through unchanged', () => {
    const onAdd = vi.fn()
    render(<AddGoalDialog onAdd={onAdd} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    fireEvent.change(screen.getByLabelText(/^Type$/), {
      target: { value: 'maxGrade' },
    })
    fireEvent.change(screen.getByLabelText(/^Cible$/), {
      target: { value: '7a' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }))
    expect(onAdd).toHaveBeenCalledWith({
      type: 'maxGrade',
      target: '7a',
      deadline: null,
    })
  })

  it('forwards the deadline when provided', () => {
    const onAdd = vi.fn()
    render(<AddGoalDialog onAdd={onAdd} />)
    fireEvent.click(
      screen.getByRole('button', { name: /Ajouter un objectif/i }),
    )
    fireEvent.change(screen.getByPlaceholderText(/p. ex./i), {
      target: { value: '30' },
    })
    fireEvent.change(screen.getByLabelText(/Échéance/i), {
      target: { value: '2026-12-31' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Créer/i }))
    expect(onAdd).toHaveBeenCalledWith({
      type: 'tickCount',
      target: 30,
      deadline: '2026-12-31',
    })
  })
})
