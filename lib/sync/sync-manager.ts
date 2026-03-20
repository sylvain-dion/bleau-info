/**
 * Core sync orchestrator.
 *
 * Collects unsynced items from all Zustand stores, syncs them
 * one-by-one via the SyncAdapter, with exponential backoff on failure.
 */

import type { SyncAdapter } from './sync-adapter'
import type { SyncQueueItem, SyncResult, SyncItemType } from './types'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useTickStore } from '@/stores/tick-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'

const MAX_RETRIES = 5
const MAX_BACKOFF_MS = 30_000

/** Calculate exponential backoff delay: min(1000 * 2^n, 30s) */
export function getBackoffDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), MAX_BACKOFF_MS)
}

/** Collect all unsynced items across all stores */
function collectUnsyncedItems(): SyncQueueItem[] {
  const items: SyncQueueItem[] = []

  const drafts = useBoulderDraftStore.getState().getUnsyncedDrafts()
  for (const d of drafts) {
    items.push({ id: d.id, type: 'draft', retryCount: 0 })
  }

  const suggestions = useSuggestionStore.getState().getUnsyncedSuggestions()
  for (const s of suggestions) {
    items.push({ id: s.id, type: 'suggestion', retryCount: 0 })
  }

  const ticks = useTickStore.getState().getUnsyncedTicks()
  for (const t of ticks) {
    items.push({ id: t.id, type: 'tick', retryCount: 0 })
  }

  const videos = useVideoSubmissionStore.getState().getUnsyncedSubmissions()
  for (const v of videos) {
    items.push({ id: v.id, type: 'video', retryCount: 0 })
  }

  return items
}

/** Set an item's sync status across the right store */
function setItemStatus(
  type: SyncItemType,
  id: string,
  status: 'pending' | 'synced' | 'error'
): void {
  switch (type) {
    case 'draft':
      useBoulderDraftStore.getState().setSyncStatus(id, status)
      break
    case 'suggestion':
      useSuggestionStore.getState().setSyncStatus(id, status)
      break
    case 'tick':
      useTickStore.getState().setSyncStatus(id, status)
      break
    case 'video':
      useVideoSubmissionStore.getState().setSyncStatus(id, status)
      break
  }
}

/** Call the right adapter method based on item type */
function callAdapter(
  adapter: SyncAdapter,
  type: SyncItemType,
  id: string
): Promise<void> {
  switch (type) {
    case 'draft':
      return adapter.syncDraft(id)
    case 'suggestion':
      return adapter.syncSuggestion(id)
    case 'tick':
      return adapter.syncTick(id)
    case 'video':
      return adapter.syncVideo(id)
  }
}

export class SyncManager {
  private adapter: SyncAdapter
  private isRunning = false

  constructor(adapter: SyncAdapter) {
    this.adapter = adapter
  }

  /** Whether a sync is currently in progress */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * Sync all unsynced items from all stores.
   *
   * Items are synced one-by-one. Each failed item retries with
   * exponential backoff up to MAX_RETRIES times.
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isRunning) {
      return { synced: 0, failed: 0, total: 0 }
    }

    this.isRunning = true

    try {
      const items = collectUnsyncedItems()
      let synced = 0
      let failed = 0

      for (const item of items) {
        const success = await this.syncItem(item)
        if (success) {
          synced++
        } else {
          failed++
        }
      }

      return { synced, failed, total: items.length }
    } finally {
      this.isRunning = false
    }
  }

  /** Sync a single item with exponential backoff retry */
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    setItemStatus(item.type, item.id, 'pending')

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await callAdapter(this.adapter, item.type, item.id)
        setItemStatus(item.type, item.id, 'synced')
        return true
      } catch {
        if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries exhausted
    setItemStatus(item.type, item.id, 'error')
    return false
  }
}
