import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStorageEstimate, formatBytes } from '@/lib/offline/storage-quota'

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 o')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 Ko')
  })

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 Mo')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 Go')
  })
})

describe('getStorageEstimate', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns zeros when API is unavailable', async () => {
    // In test env, navigator.storage.estimate may not exist
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    })

    const estimate = await getStorageEstimate()
    expect(estimate.quota).toBe(0)
    expect(estimate.usage).toBe(0)
    expect(estimate.available).toBe(0)

    Object.defineProperty(globalThis, 'navigator', {
      value: original,
      writable: true,
      configurable: true,
    })
  })

  it('returns estimates when API is available', async () => {
    const mockEstimate = { quota: 1000000, usage: 500000 }
    const original = globalThis.navigator

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        storage: {
          estimate: vi.fn().mockResolvedValue(mockEstimate),
        },
      },
      writable: true,
      configurable: true,
    })

    const estimate = await getStorageEstimate()
    expect(estimate.quota).toBe(1000000)
    expect(estimate.usage).toBe(500000)
    expect(estimate.available).toBe(500000)

    Object.defineProperty(globalThis, 'navigator', {
      value: original,
      writable: true,
      configurable: true,
    })
  })
})
