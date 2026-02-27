import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapControls } from '@/components/map/map-controls'

describe('MapControls', () => {
  it('should render zoom in, zoom out, and locate buttons', () => {
    render(
      <MapControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onLocate={vi.fn()} />
    )

    expect(screen.getByRole('button', { name: /^zoomer$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dézoomer$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /me localiser/i })).toBeInTheDocument()
  })

  it('should call onZoomIn when zoom in button is clicked', () => {
    const onZoomIn = vi.fn()
    render(
      <MapControls onZoomIn={onZoomIn} onZoomOut={vi.fn()} onLocate={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: /^zoomer$/i }))
    expect(onZoomIn).toHaveBeenCalledOnce()
  })

  it('should call onZoomOut when zoom out button is clicked', () => {
    const onZoomOut = vi.fn()
    render(
      <MapControls onZoomIn={vi.fn()} onZoomOut={onZoomOut} onLocate={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: /^dézoomer$/i }))
    expect(onZoomOut).toHaveBeenCalledOnce()
  })

  it('should call onLocate when locate button is clicked', () => {
    const onLocate = vi.fn()
    render(
      <MapControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onLocate={onLocate} />
    )

    fireEvent.click(screen.getByRole('button', { name: /me localiser/i }))
    expect(onLocate).toHaveBeenCalledOnce()
  })

  it('should have accessible labels on all buttons', () => {
    render(
      <MapControls onZoomIn={vi.fn()} onZoomOut={vi.fn()} onLocate={vi.fn()} />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)

    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-label')
    }
  })
})
