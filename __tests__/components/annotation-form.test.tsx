import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnnotationForm } from '@/components/stats/annotation-form'
import type { Annotation } from '@/lib/validations/annotation'

describe('AnnotationForm', () => {
  const onSubmit = vi.fn()
  const onClose = vi.fn()

  it('renders add mode by default', () => {
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    expect(screen.getByText('Nouvelle annotation')).toBeInTheDocument()
    expect(screen.getByText('Ajouter')).toBeInTheDocument()
  })

  it('renders edit mode when editingAnnotation is provided', () => {
    const annotation: Annotation = {
      id: '1',
      date: '2026-03-01',
      text: 'Blessure',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    }
    render(
      <AnnotationForm
        onSubmit={onSubmit}
        onClose={onClose}
        editingAnnotation={annotation}
      />
    )
    expect(screen.getByText(/Modifier l.annotation/)).toBeInTheDocument()
    expect(screen.getByText('Modifier')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Blessure')).toBeInTheDocument()
  })

  it('shows character counter', () => {
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('calls onClose when Annuler is clicked', async () => {
    const user = userEvent.setup()
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    await user.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    await user.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('has a date input and text input', () => {
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Texte')).toBeInTheDocument()
  })

  it('shows placeholder text', () => {
    render(<AnnotationForm onSubmit={onSubmit} onClose={onClose} />)
    expect(
      screen.getByPlaceholderText(/Blessure/)
    ).toBeInTheDocument()
  })
})
