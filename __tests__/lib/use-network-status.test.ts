import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '@/lib/hooks/use-network-status'
import { useNetworkStore } from '@/stores/network-store'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNetworkStore.setState({ isOnline: true, hasDownloadedContent: false })

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it('should detect offline when navigator is offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it('should update when online event is fired', () => {
    const { result } = renderHook(() => useNetworkStatus())

    // Simulate going offline first
    act(() => {
      useNetworkStore.getState().setOffline()
    })

    expect(result.current.isOffline).toBe(true)

    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
  })

  it('should update when offline event is fired', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.isOnline).toBe(true)

    // Simulate offline event
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
  })

  it('should expose hasDownloadedContent from store', () => {
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.hasDownloadedContent).toBe(false)

    act(() => {
      useNetworkStore.getState().setDownloadedContent(true)
    })

    expect(result.current.hasDownloadedContent).toBe(true)
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    )
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    )
  })
})
