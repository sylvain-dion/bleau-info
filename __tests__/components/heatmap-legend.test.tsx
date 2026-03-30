import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeatmapLegend } from '@/components/map/heatmap-legend'
import { useMapStore } from '@/stores/map-store'

function resetStore() {
  useMapStore.setState({ showHeatmap: false })
}

describe('HeatmapLegend', () => {
  beforeEach(() => resetStore())

  it('renders nothing when heatmap is off', () => {
    const { container } = render(<HeatmapLegend />)
    expect(container.innerHTML).toBe('')
  })

  it('renders legend when heatmap is on', () => {
    useMapStore.setState({ showHeatmap: true })
    render(<HeatmapLegend />)
    expect(screen.getByText('Fréquentation')).toBeDefined()
  })

  it('shows gradient labels', () => {
    useMapStore.setState({ showHeatmap: true })
    render(<HeatmapLegend />)
    expect(screen.getByText('Peu fréquenté')).toBeDefined()
    expect(screen.getByText('Très fréquenté')).toBeDefined()
  })

  it('has accessible aria-label', () => {
    useMapStore.setState({ showHeatmap: true })
    render(<HeatmapLegend />)
    expect(
      screen.getByLabelText(
        'Légende : Peu fréquenté (bleu) à Très fréquenté (rouge)'
      )
    ).toBeDefined()
  })
})
