import type { SyncAdapter } from './sync-adapter'

/** Failure rate for simulated sync (10%) */
const FAILURE_RATE = 0.1

/** Simulate network latency (300-1000ms) with ~10% failure rate */
async function simulateUpload(type: string, id: string): Promise<void> {
  const delay = 300 + Math.random() * 700
  await new Promise((resolve) => setTimeout(resolve, delay))

  if (Math.random() < FAILURE_RATE) {
    throw new Error(`[MockSync] Failed to sync ${type} ${id}`)
  }

  // eslint-disable-next-line no-console
  console.log(`[MockSync] Synced ${type} ${id} (${Math.round(delay)}ms)`)
}

/**
 * Mock sync adapter that simulates network uploads.
 *
 * - 300-1000ms latency per item
 * - ~10% random failure rate for testing retry/backoff UI
 */
export class MockSyncAdapter implements SyncAdapter {
  async syncDraft(id: string): Promise<void> {
    return simulateUpload('draft', id)
  }

  async syncSuggestion(id: string): Promise<void> {
    return simulateUpload('suggestion', id)
  }

  async syncTick(id: string): Promise<void> {
    return simulateUpload('tick', id)
  }

  async syncVideo(id: string): Promise<void> {
    return simulateUpload('video', id)
  }
}
