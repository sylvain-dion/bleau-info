import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocationPicker } from '@/components/boulder/location-picker'

// Mock maplibre-gl (no WebGL in jsdom)
const mockOn = vi.fn()
const mockRemove = vi.fn()
const mockFlyTo = vi.fn()
const mockGetCenter = vi.fn(() => ({ lat: 48.382619, lng: 2.634521 }))
const mockGetZoom = vi.fn(() => 18)

vi.mock('maplibre-gl', () => {
  const MockMap = vi.fn().mockImplementation(() => ({
    on: mockOn,
    remove: mockRemove,
    flyTo: mockFlyTo,
    getCenter: mockGetCenter,
    getZoom: mockGetZoom,
  }))
  return { default: { Map: MockMap } }
})

// Mock geolocation hook
const mockLocate = vi.fn()
vi.mock('@/hooks/use-geolocation', () => ({
  useGeolocation: vi.fn(() => ({
    locate: mockLocate,
    position: null,
    isLocating: false,
    error: null,
  })),
}))

import { useGeolocation } from '@/hooks/use-geolocation'

describe('LocationPicker', () => {
  const defaultProps = {
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    theme: 'light' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Trigger callbacks for all registered events immediately
    mockOn.mockImplementation((event: string, callback: () => void) => {
      if (event === 'load' || event === 'move' || event === 'moveend') {
        callback()
      }
    })
  })

  it('should render the picker with title and buttons', () => {
    render(<LocationPicker {...defaultProps} />)

    expect(screen.getByText('Placer le bloc')).toBeInTheDocument()
    expect(screen.getByText('Confirmer la position')).toBeInTheDocument()
    expect(screen.getByLabelText('Annuler')).toBeInTheDocument()
    expect(screen.getByLabelText('Recentrer sur ma position')).toBeInTheDocument()
  })

  it('should render map container', () => {
    render(<LocationPicker {...defaultProps} />)

    expect(screen.getByTestId('location-map')).toBeInTheDocument()
  })

  it('should render crosshair overlay', () => {
    render(<LocationPicker {...defaultProps} />)

    // Crosshair has aria-hidden
    const crosshair = document.querySelector('[aria-hidden="true"]')
    expect(crosshair).toBeInTheDocument()
  })

  it('should display coordinates after map loads', () => {
    render(<LocationPicker {...defaultProps} />)

    const coords = screen.getByTestId('coordinates-display')
    expect(coords.textContent).toContain('48.382619° N')
    expect(coords.textContent).toContain('2.634521° E')
  })

  it('should call onCancel when back button is clicked', () => {
    render(<LocationPicker {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Annuler'))
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm with rounded coordinates when confirmed', () => {
    render(<LocationPicker {...defaultProps} />)

    fireEvent.click(screen.getByText('Confirmer la position'))
    expect(defaultProps.onConfirm).toHaveBeenCalledWith({
      latitude: 48.382619,
      longitude: 2.634521,
    })
  })

  it('should call locate() for GPS recenter', () => {
    render(<LocationPicker {...defaultProps} />)

    fireEvent.click(screen.getByLabelText('Recentrer sur ma position'))
    expect(mockLocate).toHaveBeenCalledTimes(2) // 1 from auto-locate on mount + 1 from click
  })

  it('should auto-locate when no initial position', () => {
    render(<LocationPicker {...defaultProps} />)

    // locate() called once on mount since no initialPosition
    expect(mockLocate).toHaveBeenCalledTimes(1)
  })

  it('should not auto-locate when initial position is provided', () => {
    render(
      <LocationPicker
        {...defaultProps}
        initialPosition={{ latitude: 48.4, longitude: 2.63 }}
      />
    )

    // locate() should NOT be called on mount
    expect(mockLocate).not.toHaveBeenCalled()
  })

  it('should use high accuracy geolocation', () => {
    render(<LocationPicker {...defaultProps} />)

    expect(useGeolocation).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { enableHighAccuracy: true }
    )
  })

  it('should have dialog role with accessible label', () => {
    render(<LocationPicker {...defaultProps} />)

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      'Placer le bloc sur la carte'
    )
  })

  it('should display zoom level', () => {
    render(<LocationPicker {...defaultProps} />)

    expect(screen.getByText('Zoom 18')).toBeInTheDocument()
  })
})
