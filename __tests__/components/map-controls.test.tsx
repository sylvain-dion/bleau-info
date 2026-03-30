import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapControls } from '@/components/map/map-controls'

const defaultProps = {
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onLocate: vi.fn(),
  onToggleHeatmap: vi.fn(),
  heatmapActive: false,
}

describe('MapControls', () => {
  it('should render zoom in, zoom out, locate, and heatmap buttons', () => {
    render(<MapControls {...defaultProps} />)

    expect(screen.getByRole('button', { name: /^zoomer$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^dézoomer$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /me localiser/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fréquentation/i })).toBeInTheDocument()
  })

  it('should call onZoomIn when zoom in button is clicked', () => {
    const onZoomIn = vi.fn()
    render(<MapControls {...defaultProps} onZoomIn={onZoomIn} />)

    fireEvent.click(screen.getByRole('button', { name: /^zoomer$/i }))
    expect(onZoomIn).toHaveBeenCalledOnce()
  })

  it('should call onZoomOut when zoom out button is clicked', () => {
    const onZoomOut = vi.fn()
    render(<MapControls {...defaultProps} onZoomOut={onZoomOut} />)

    fireEvent.click(screen.getByRole('button', { name: /^dézoomer$/i }))
    expect(onZoomOut).toHaveBeenCalledOnce()
  })

  it('should call onLocate when locate button is clicked', () => {
    const onLocate = vi.fn()
    render(<MapControls {...defaultProps} onLocate={onLocate} />)

    fireEvent.click(screen.getByRole('button', { name: /me localiser/i }))
    expect(onLocate).toHaveBeenCalledOnce()
  })

  it('should call onToggleHeatmap when heatmap button is clicked', () => {
    const onToggleHeatmap = vi.fn()
    render(<MapControls {...defaultProps} onToggleHeatmap={onToggleHeatmap} />)

    fireEvent.click(screen.getByRole('button', { name: /fréquentation/i }))
    expect(onToggleHeatmap).toHaveBeenCalledOnce()
  })

  it('should have accessible labels on all buttons', () => {
    render(<MapControls {...defaultProps} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)

    for (const button of buttons) {
      expect(button).toHaveAttribute('aria-label')
    }
  })

  it('should show heatmap button as active when heatmapActive is true', () => {
    render(<MapControls {...defaultProps} heatmapActive />)

    const heatmapBtn = screen.getByRole('button', { name: /fréquentation/i })
    expect(heatmapBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('should show heatmap button as inactive when heatmapActive is false', () => {
    render(<MapControls {...defaultProps} heatmapActive={false} />)

    const heatmapBtn = screen.getByRole('button', { name: /fréquentation/i })
    expect(heatmapBtn.getAttribute('aria-pressed')).toBe('false')
  })
})
