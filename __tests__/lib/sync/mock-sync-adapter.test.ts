import { describe, it, expect, vi } from 'vitest'
import { MockSyncAdapter } from '@/lib/sync/mock-sync-adapter'

describe('MockSyncAdapter', () => {
  const adapter = new MockSyncAdapter()

  it('syncDraft resolves or rejects (never hangs)', async () => {
    // Seed Math.random to always succeed (> 0.1)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await expect(adapter.syncDraft('test-id')).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('syncSuggestion resolves on success', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await expect(adapter.syncSuggestion('s1')).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('syncTick resolves on success', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await expect(adapter.syncTick('t1')).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('syncVideo resolves on success', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await expect(adapter.syncVideo('v1')).resolves.toBeUndefined()
    vi.restoreAllMocks()
  })

  it('throws when random falls below failure rate', async () => {
    // Force failure (Math.random < 0.1)
    vi.spyOn(Math, 'random').mockReturnValue(0.05)
    await expect(adapter.syncDraft('fail-id')).rejects.toThrow('[MockSync]')
    vi.restoreAllMocks()
  })
})
