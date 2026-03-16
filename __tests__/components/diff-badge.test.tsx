import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffBadge } from '@/components/boulder/diff-badge'

describe('DiffBadge', () => {
  it('should render nothing when values are equal', () => {
    const { container } = render(
      <DiffBadge original="6a" current="6a" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render badge when values differ', () => {
    render(<DiffBadge original="6a" current="6b" />)

    const badge = screen.getByTestId('diff-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Modifié · Avant : 6a')
  })

  it('should use formatValue when provided', () => {
    const formatGrade = (v: string) => v.toUpperCase()

    render(
      <DiffBadge original="6a" current="6b" formatValue={formatGrade} />
    )

    expect(screen.getByTestId('diff-badge')).toHaveTextContent(
      'Modifié · Avant : 6A'
    )
  })

  it('should render badge when original is empty and current is not', () => {
    render(<DiffBadge original="" current="Nouvelle valeur" />)

    expect(screen.getByTestId('diff-badge')).toHaveTextContent(
      'Modifié · Avant :'
    )
  })

  it('should render badge when current is empty and original is not', () => {
    render(<DiffBadge original="Ancienne valeur" current="" />)

    expect(screen.getByTestId('diff-badge')).toHaveTextContent(
      'Modifié · Avant : Ancienne valeur'
    )
  })

  it('should render nothing when both values are empty', () => {
    const { container } = render(
      <DiffBadge original="" current="" />
    )
    expect(container.firstChild).toBeNull()
  })
})
