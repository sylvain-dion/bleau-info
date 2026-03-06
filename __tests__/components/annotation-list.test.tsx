import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnnotationList } from '@/components/stats/annotation-list'
import type { Annotation } from '@/lib/validations/annotation'

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    date: '2026-03-01',
    text: 'Test annotation',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

describe('AnnotationList', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()

  it('renders nothing when annotations is empty', () => {
    const { container } = render(
      <AnnotationList annotations={[]} onEdit={onEdit} onDelete={onDelete} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows annotation count', () => {
    const annotations = [
      makeAnnotation({ id: '1', text: 'A' }),
      makeAnnotation({ id: '2', text: 'B' }),
    ]
    render(
      <AnnotationList
        annotations={annotations}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('Annotations (2)')).toBeInTheDocument()
  })

  it('displays annotation text and date', () => {
    const annotations = [
      makeAnnotation({ id: '1', date: '2026-03-15', text: 'Blessure épaule' }),
    ]
    render(
      <AnnotationList
        annotations={annotations}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    expect(screen.getByText('Blessure épaule')).toBeInTheDocument()
    // French date format
    expect(screen.getByText(/15/)).toBeInTheDocument()
  })

  it('sorts annotations by date', () => {
    const annotations = [
      makeAnnotation({ id: '2', date: '2026-06-01', text: 'Reprise' }),
      makeAnnotation({ id: '1', date: '2026-01-15', text: 'Stage' }),
    ]
    render(
      <AnnotationList
        annotations={annotations}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Stage')
    expect(items[1]).toHaveTextContent('Reprise')
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const annotation = makeAnnotation({ id: '1', text: 'Test' })
    render(
      <AnnotationList
        annotations={[annotation]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
    await user.click(screen.getByLabelText('Modifier "Test"'))
    expect(onEdit).toHaveBeenCalledWith(annotation)
  })

  it('requires double-click to delete (confirmation)', async () => {
    const user = userEvent.setup()
    const annotation = makeAnnotation({ id: '1', text: 'Test' })
    render(
      <AnnotationList
        annotations={[annotation]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    // First click: enters confirmation state
    await user.click(screen.getByLabelText('Supprimer "Test"'))
    expect(onDelete).not.toHaveBeenCalled()

    // Second click: confirms deletion
    await user.click(
      screen.getByLabelText('Confirmer la suppression de "Test"')
    )
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
