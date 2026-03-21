import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBackoffDelay, SyncManager } from '@/lib/sync/sync-manager'
import type { SyncAdapter } from '@/lib/sync/sync-adapter'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useTickStore } from '@/stores/tick-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'

/** Build a mock adapter where every method resolves */
function createSuccessAdapter(): SyncAdapter {
  const ok = { status: 'synced' as const }
  return {
    syncDraft: vi.fn().mockResolvedValue(ok),
    syncSuggestion: vi.fn().mockResolvedValue(ok),
    syncTick: vi.fn().mockResolvedValue(ok),
    syncVideo: vi.fn().mockResolvedValue(ok),
  }
}

/** Build an adapter that always rejects */
function createFailingAdapter(): SyncAdapter {
  return {
    syncDraft: vi.fn().mockRejectedValue(new Error('fail')),
    syncSuggestion: vi.fn().mockRejectedValue(new Error('fail')),
    syncTick: vi.fn().mockRejectedValue(new Error('fail')),
    syncVideo: vi.fn().mockRejectedValue(new Error('fail')),
  }
}

describe('getBackoffDelay', () => {
  it('returns 1s for first retry', () => {
    expect(getBackoffDelay(0)).toBe(1000)
  })

  it('doubles each time', () => {
    expect(getBackoffDelay(1)).toBe(2000)
    expect(getBackoffDelay(2)).toBe(4000)
    expect(getBackoffDelay(3)).toBe(8000)
  })

  it('caps at 30 seconds', () => {
    expect(getBackoffDelay(10)).toBe(30_000)
    expect(getBackoffDelay(100)).toBe(30_000)
  })
})

describe('SyncManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset all stores to empty state
    useBoulderDraftStore.setState({ drafts: [] })
    useSuggestionStore.setState({ suggestions: [] })
    useTickStore.setState({ ticks: [] })
    useVideoSubmissionStore.setState({ submissions: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns zeros when no unsynced items', async () => {
    const manager = new SyncManager(createSuccessAdapter())
    const result = await manager.syncAll()
    expect(result).toEqual({ synced: 0, failed: 0, conflicts: 0, total: 0 })
  })

  it('syncs items across all stores', async () => {
    // Seed stores with unsynced items
    useBoulderDraftStore.setState({
      drafts: [
        { id: 'draft-1', syncStatus: 'local' } as any,
      ],
    })
    useTickStore.setState({
      ticks: [
        { id: 'tick-1', syncStatus: 'local' } as any,
      ],
    })

    // Need to provide getUnsyncedDrafts/getUnsyncedTicks
    useBoulderDraftStore.getState().getUnsyncedDrafts = () =>
      useBoulderDraftStore.getState().drafts.filter((d) => d.syncStatus !== 'synced')
    useTickStore.getState().getUnsyncedTicks = () =>
      useTickStore.getState().ticks.filter((t) => t.syncStatus !== 'synced')

    const adapter = createSuccessAdapter()
    const manager = new SyncManager(adapter)
    const result = await manager.syncAll()

    expect(result.synced).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(2)
    expect(adapter.syncDraft).toHaveBeenCalledWith('draft-1')
    expect(adapter.syncTick).toHaveBeenCalledWith('tick-1')
  })

  it('prevents concurrent syncAll calls', async () => {
    useBoulderDraftStore.setState({
      drafts: [{ id: 'd1', syncStatus: 'local' } as any],
    })
    useBoulderDraftStore.getState().getUnsyncedDrafts = () =>
      useBoulderDraftStore.getState().drafts.filter((d) => d.syncStatus !== 'synced')

    const adapter = createSuccessAdapter()
    // Make adapter slow
    adapter.syncDraft = vi.fn(() => new Promise((r) => setTimeout(() => r({ status: 'synced' }), 1000)))

    const manager = new SyncManager(adapter)

    // Start first sync (don't await)
    const first = manager.syncAll()
    // Second sync should return immediately with zeros
    const second = await manager.syncAll()

    expect(second).toEqual({ synced: 0, failed: 0, conflicts: 0, total: 0 })

    // Advance timers so first can complete
    await vi.advanceTimersByTimeAsync(1500)
    const firstResult = await first
    expect(firstResult.total).toBe(1)
  })

  it('marks items as error after max retries and uses backoff', async () => {
    useBoulderDraftStore.setState({
      drafts: [{ id: 'd1', syncStatus: 'local' } as any],
    })
    useBoulderDraftStore.getState().getUnsyncedDrafts = () =>
      useBoulderDraftStore.getState().drafts.filter((d) => d.syncStatus !== 'synced')

    const adapter = createFailingAdapter()
    const manager = new SyncManager(adapter)

    // syncAll will retry with backoff — need to advance timers
    const syncPromise = manager.syncAll()

    // Advance through all backoff delays (1s + 2s + 4s + 8s + 16s = 31s for 5 retries)
    await vi.advanceTimersByTimeAsync(60_000)

    const result = await syncPromise
    expect(result.failed).toBe(1)
    expect(result.synced).toBe(0)

    // adapter called 6 times total (1 initial + 5 retries)
    expect(adapter.syncDraft).toHaveBeenCalledTimes(6)
  })

  it('resets isRunning flag even when sync fails', async () => {
    const adapter = createFailingAdapter()
    const manager = new SyncManager(adapter)
    await manager.syncAll()
    expect(manager.running).toBe(false)
  })
})

// Need to import afterEach at top level
import { afterEach } from 'vitest'
