import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpoilerVeil } from '@/components/boulder/spoiler-veil'

describe('SpoilerVeil', () => {
  it('renders children directly when hidden=false (no wrapper)', () => {
    const { container } = render(
      <SpoilerVeil hidden={false} onReveal={vi.fn()}>
        <p data-testid="payload">Bêta révélée</p>
      </SpoilerVeil>,
    )

    expect(screen.getByTestId('payload')).toBeInTheDocument()
    // No spoiler-veil container in the DOM
    expect(container.querySelector('[data-testid="spoiler-veil"]')).toBeNull()
  })

  it('renders the veil and a reveal button when hidden=true', () => {
    render(
      <SpoilerVeil hidden onReveal={vi.fn()}>
        <p>Spoiler payload</p>
      </SpoilerVeil>,
    )

    expect(screen.getByTestId('spoiler-veil')).toBeInTheDocument()
    expect(screen.getByTestId('spoiler-veil-reveal')).toBeInTheDocument()
    expect(screen.getByText('Bêta masquée')).toBeInTheDocument()
  })

  it('calls onReveal when the button is clicked', () => {
    const onReveal = vi.fn()
    render(
      <SpoilerVeil hidden onReveal={onReveal}>
        <p>x</p>
      </SpoilerVeil>,
    )

    fireEvent.click(screen.getByTestId('spoiler-veil-reveal'))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('uses a video-specific label when kind="video"', () => {
    render(
      <SpoilerVeil hidden onReveal={vi.fn()} kind="video">
        <iframe title="vid" />
      </SpoilerVeil>,
    )

    expect(screen.getByText('Vidéo masquée')).toBeInTheDocument()
    expect(screen.getByTestId('spoiler-veil')).toHaveAttribute(
      'data-kind',
      'video',
    )
  })

  it('hides the underlying children from assistive tech when veiled', () => {
    render(
      <SpoilerVeil hidden onReveal={vi.fn()}>
        <p data-testid="payload">Spoiler payload</p>
      </SpoilerVeil>,
    )

    const payload = screen.getByTestId('payload')
    // Walk up to the inert wrapper that the veil renders.
    const wrapper = payload.closest('[aria-hidden="true"]')
    expect(wrapper).not.toBeNull()
  })
})
