import { describe, it, expect, vi } from 'vitest'
import { MockSyncAdapter } from '@/lib/sync/mock-sync-adapter'

describe('MockSyncAdapter', () => {
  const adapter = new MockSyncAdapter()

  it('syncDraft resolves with synced status', async () => {
    // Seed Math.random to always succeed (> 0.1)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = await adapter.syncDraft('test-id')
    expect(result.status).toBe('synced')
    vi.restoreAllMocks()
  })

  it('syncSuggestion resolves on success (no conflict when random > conflict rate)', async () => {
    // 0.5 > FAILURE_RATE(0.1) so upload succeeds, 0.5 > CONFLICT_RATE(0.2) so no conflict
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = await adapter.syncSuggestion('s1')
    expect(result.status).toBe('synced')
    vi.restoreAllMocks()
  })

  it('syncTick resolves with synced status', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = await adapter.syncTick('t1')
    expect(result.status).toBe('synced')
    vi.restoreAllMocks()
  })

  it('syncVideo resolves with synced status', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const result = await adapter.syncVideo('v1')
    expect(result.status).toBe('synced')
    vi.restoreAllMocks()
  })

  it('throws when random falls below failure rate', async () => {
    // Force failure (Math.random < 0.1)
    vi.spyOn(Math, 'random').mockReturnValue(0.05)
    await expect(adapter.syncDraft('fail-id')).rejects.toThrow('[MockSync]')
    vi.restoreAllMocks()
  })
})
