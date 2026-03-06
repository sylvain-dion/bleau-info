import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoLocate } from '@/hooks/use-auto-locate'

// Mock geolocation guard
vi.mock('@/lib/geolocation-guard', () => ({
  isGeolocationAvailable: vi.fn(() => true),
  isPageVisible: vi.fn(() => true),
}))

// Mock maplibre config
vi.mock('@/lib/maplibre/config', () => ({
  MAP_INTERACTION: { flyToDuration: 500 },
}))

import { isPageVisible } from '@/lib/geolocation-guard'

const mockGetCurrentPosition = vi.fn()
const mockFlyTo = vi.fn()
const mockGetZoom = vi.fn(() => 15)

function createMockMapRef() {
  return {
    current: {
      flyTo: mockFlyTo,
      getZoom: mockGetZoom,
    },
  } as unknown as React.RefObject<{ flyTo: typeof mockFlyTo; getZoom: typeof mockGetZoom }>
}

describe('useAutoLocate', () => {
  let hiddenSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })
    hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    vi.mocked(isPageVisible).mockReturnValue(true)
  })

  afterEach(() => {
    hiddenSpy.mockRestore()
  })

  it('registers visibilitychange listener', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const mapRef = createMockMapRef()

    renderHook(() => useAutoLocate(mapRef as never, true))

    expect(addSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
    addSpy.mockRestore()
  })

  it('removes listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const mapRef = createMockMapRef()

    const { unmount } = renderHook(() => useAutoLocate(mapRef as never, true))
    unmount()

    expect(removeSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    )
    removeSpy.mockRestore()
  })

  it('does not request position on visibilitychange when disabled', () => {
    const mapRef = createMockMapRef()
    renderHook(() => useAutoLocate(mapRef as never, false))

    // Simulate page becoming visible
    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
  })

  it('requests position on visibilitychange when enabled and visible', () => {
    const mapRef = createMockMapRef()
    renderHook(() => useAutoLocate(mapRef as never, true))

    // Simulate page becoming visible
    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('does not request position when page is hidden', () => {
    vi.mocked(isPageVisible).mockReturnValue(false)
    const mapRef = createMockMapRef()
    renderHook(() => useAutoLocate(mapRef as never, true))

    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
  })

  it('flies to position on successful geolocation', () => {
    mockGetCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: 48.4, longitude: 2.63 } })
    })
    const mapRef = createMockMapRef()
    renderHook(() => useAutoLocate(mapRef as never, true))

    document.dispatchEvent(new Event('visibilitychange'))

    expect(mockFlyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        center: [2.63, 48.4],
        zoom: 15,
      })
    )
  })
})
