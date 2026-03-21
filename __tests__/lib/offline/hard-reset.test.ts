import { describe, it, expect, vi, beforeEach } from 'vitest'
import { performHardReset, HARD_RESET_FLAG } from '@/lib/offline/hard-reset'

// Mock Dexie.delete
vi.mock('dexie', () => ({
  default: {
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('performHardReset', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()

    // Seed localStorage with Zustand keys
    localStorage.setItem('bleau-offline-sectors', '{"state":{}}')
    localStorage.setItem('bleau-boulder-drafts', '{"state":{}}')
    localStorage.setItem('bleau-boulder-suggestions', '{"state":{}}')
    localStorage.setItem('bleau-ticks', '{"state":{}}')
    localStorage.setItem('bleau-video-submissions', '{"state":{}}')
    localStorage.setItem('bleau-annotations', '{"state":{}}')
    localStorage.setItem('bleau-lists', '{"state":{}}')
    // Should NOT be cleared
    localStorage.setItem('theme', 'dark')
  })

  it('returns success on happy path', async () => {
    const result = await performHardReset()
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('clears Zustand localStorage keys', async () => {
    await performHardReset()

    expect(localStorage.getItem('bleau-offline-sectors')).toBeNull()
    expect(localStorage.getItem('bleau-boulder-drafts')).toBeNull()
    expect(localStorage.getItem('bleau-boulder-suggestions')).toBeNull()
    expect(localStorage.getItem('bleau-ticks')).toBeNull()
    expect(localStorage.getItem('bleau-video-submissions')).toBeNull()
    expect(localStorage.getItem('bleau-annotations')).toBeNull()
    expect(localStorage.getItem('bleau-lists')).toBeNull()
  })

  it('preserves non-Zustand keys (theme)', async () => {
    await performHardReset()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('calls Dexie.delete for both databases', async () => {
    const Dexie = (await import('dexie')).default
    await performHardReset()

    expect(Dexie.delete).toHaveBeenCalledWith('bleau-offline')
    expect(Dexie.delete).toHaveBeenCalledWith('bleau-drafts')
  })

  it('sets hard reset flag for post-reload toast', async () => {
    await performHardReset()
    expect(localStorage.getItem(HARD_RESET_FLAG)).toBe('1')
  })

  it('returns error on failure', async () => {
    const Dexie = (await import('dexie')).default
    vi.mocked(Dexie.delete).mockRejectedValueOnce(new Error('DB locked'))

    const result = await performHardReset()
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB locked')
  })
})
