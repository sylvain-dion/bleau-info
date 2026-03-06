import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from '@/hooks/use-geolocation'

// Mock the guard module
vi.mock('@/lib/geolocation-guard', () => ({
  shouldRequestPosition: vi.fn(() => true),
}))

import { shouldRequestPosition } from '@/lib/geolocation-guard'

const mockGetCurrentPosition = vi.fn()

describe('useGeolocation', () => {
  let hiddenSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })

    hiddenSpy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    vi.mocked(shouldRequestPosition).mockReturnValue(true)
  })

  afterEach(() => {
    hiddenSpy.mockRestore()
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.position).toBeNull()
    expect(result.current.isLocating).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.locate).toBe('function')
  })

  it('calls getCurrentPosition on locate()', () => {
    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.locate()
    })

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
    expect(result.current.isLocating).toBe(true)
  })

  it('sets position on success', () => {
    const onSuccess = vi.fn()
    mockGetCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 48.4, longitude: 2.63 },
      })
    })

    const { result } = renderHook(() => useGeolocation(onSuccess))

    act(() => {
      result.current.locate()
    })

    expect(result.current.position).toEqual({
      latitude: 48.4,
      longitude: 2.63,
    })
    expect(result.current.isLocating).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith({
      latitude: 48.4,
      longitude: 2.63,
    })
  })

  it('sets error on failure', () => {
    const onError = vi.fn()
    const geoError = { code: 1, message: 'Denied' } as GeolocationPositionError

    mockGetCurrentPosition.mockImplementation((_success, error) => {
      error(geoError)
    })

    const { result } = renderHook(() => useGeolocation(undefined, onError))

    act(() => {
      result.current.locate()
    })

    expect(result.current.error).toBe(geoError)
    expect(result.current.isLocating).toBe(false)
    expect(onError).toHaveBeenCalled()
  })

  it('does not call getCurrentPosition when page is hidden', () => {
    vi.mocked(shouldRequestPosition).mockReturnValue(false)
    const onError = vi.fn()

    const { result } = renderHook(() => useGeolocation(undefined, onError))

    act(() => {
      result.current.locate()
    })

    expect(mockGetCurrentPosition).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
  })
})
