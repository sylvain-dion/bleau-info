import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isGeolocationAvailable,
  isPageVisible,
  shouldRequestPosition,
} from '@/lib/geolocation-guard'

describe('geolocation-guard', () => {
  // jsdom doesn't provide navigator.geolocation by default, so mock it
  beforeEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      writable: true,
      configurable: true,
    })
  })

  describe('isGeolocationAvailable', () => {
    it('returns true when navigator.geolocation exists', () => {
      expect(isGeolocationAvailable()).toBe(true)
    })

    it('returns false when navigator is undefined', () => {
      const originalNavigator = globalThis.navigator
      Object.defineProperty(globalThis, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      expect(isGeolocationAvailable()).toBe(false)
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      })
    })
  })

  describe('isPageVisible', () => {
    let hiddenSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      hiddenSpy = vi.spyOn(document, 'hidden', 'get')
    })

    afterEach(() => {
      hiddenSpy.mockRestore()
    })

    it('returns true when document is not hidden', () => {
      hiddenSpy.mockReturnValue(false)
      expect(isPageVisible()).toBe(true)
    })

    it('returns false when document is hidden', () => {
      hiddenSpy.mockReturnValue(true)
      expect(isPageVisible()).toBe(false)
    })
  })

  describe('shouldRequestPosition', () => {
    let hiddenSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      hiddenSpy = vi.spyOn(document, 'hidden', 'get')
    })

    afterEach(() => {
      hiddenSpy.mockRestore()
    })

    it('returns true when geolocation available and page visible', () => {
      hiddenSpy.mockReturnValue(false)
      expect(shouldRequestPosition()).toBe(true)
    })

    it('returns false when page is hidden', () => {
      hiddenSpy.mockReturnValue(true)
      expect(shouldRequestPosition()).toBe(false)
    })
  })
})
