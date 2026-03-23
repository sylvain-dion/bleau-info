/**
 * Core sync orchestrator.
 *
 * Collects unsynced items from all Zustand stores, syncs them
 * one-by-one via the SyncAdapter, with exponential backoff on failure.
 * Handles conflict responses for suggestions (LWW or geographic).
 */

import type { SyncAdapter } from './sync-adapter'
import type { SyncQueueItem, SyncResult, SyncItemType, SyncItemResponse } from './types'
import { classifyConflict } from './conflict-resolver'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { useTickStore } from '@/stores/tick-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { useCommentStore } from '@/stores/comment-store'
import { useConflictStore } from '@/stores/conflict-store'

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

  const comments = useCommentStore.getState().getUnsyncedComments()
  for (const c of comments) {
    items.push({ id: c.id, type: 'comment', retryCount: 0 })
  }

  return items
}

/** Set an item's sync status across the right store */
function setItemStatus(
  type: SyncItemType,
  id: string,
  status: 'pending' | 'synced' | 'conflict' | 'error'
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
    case 'comment':
      useCommentStore.getState().setSyncStatus(id, status)
      break
  }
}

/** Call the right adapter method based on item type */
function callAdapter(
  adapter: SyncAdapter,
  type: SyncItemType,
  id: string
): Promise<SyncItemResponse> {
  switch (type) {
    case 'draft':
      return adapter.syncDraft(id)
    case 'suggestion':
      return adapter.syncSuggestion(id)
    case 'tick':
      return adapter.syncTick(id)
    case 'video':
      return adapter.syncVideo(id)
    case 'comment':
      return adapter.syncComment(id)
  }
}

/** Sync result type: 'synced' | 'conflict' | 'failed' */
type ItemOutcome = 'synced' | 'conflict' | 'failed'

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
      return { synced: 0, failed: 0, conflicts: 0, total: 0 }
    }

    this.isRunning = true

    try {
      const items = collectUnsyncedItems()
      let synced = 0
      let failed = 0
      let conflicts = 0

      for (const item of items) {
        const outcome = await this.syncItem(item)
        switch (outcome) {
          case 'synced':
            synced++
            break
          case 'conflict':
            conflicts++
            break
          case 'failed':
            failed++
            break
        }
      }

      return { synced, failed, conflicts, total: items.length }
    } finally {
      this.isRunning = false
    }
  }

  /** Sync a single item with exponential backoff retry */
  private async syncItem(item: SyncQueueItem): Promise<ItemOutcome> {
    setItemStatus(item.type, item.id, 'pending')

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await callAdapter(this.adapter, item.type, item.id)

        // Handle conflict response (only for suggestions)
        if (response.status === 'conflict' && response.conflict && item.type === 'suggestion') {
          return this.handleConflict(item.id, response.conflict.remoteVersion)
        }

        setItemStatus(item.type, item.id, 'synced')
        return 'synced'
      } catch {
        if (attempt < MAX_RETRIES) {
          const delay = getBackoffDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    // All retries exhausted
    setItemStatus(item.type, item.id, 'error')
    return 'failed'
  }

  /**
   * Handle a conflict on a suggestion.
   *
   * Runs classifyConflict to determine if it's LWW-resolvable
   * or requires manual geographic merge.
   */
  private handleConflict(
    suggestionId: string,
    remoteVersion: Record<string, unknown>
  ): ItemOutcome {
    const suggestion = useSuggestionStore.getState().getSuggestion(suggestionId)
    if (!suggestion) {
      setItemStatus('suggestion', suggestionId, 'error')
      return 'failed'
    }

    const localVersion: Record<string, unknown> = {
      name: suggestion.name,
      grade: suggestion.grade,
      style: suggestion.style,
      sector: suggestion.sector,
      exposure: suggestion.exposure,
      strollerAccessible: suggestion.strollerAccessible,
      description: suggestion.description,
      height: suggestion.height,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }

    const classification = classifyConflict(localVersion, remoteVersion)

    switch (classification.type) {
      case 'none':
        // No actual differences — mark synced
        setItemStatus('suggestion', suggestionId, 'synced')
        return 'synced'

      case 'lww-resolved':
        // Simple fields differ — LWW auto-resolves, mark synced
        setItemStatus('suggestion', suggestionId, 'synced')
        return 'synced'

      case 'geographic': {
        // Geographic conflict — store for manual resolution
        useConflictStore.getState().addConflict({
          suggestionId,
          boulderId: suggestion.originalBoulderId,
          boulderName: suggestion.name,
          conflictType: 'geographic',
          diffs: classification.diffs,
          localVersion,
          remoteVersion,
          distanceMeters: classification.distanceMeters,
        })

        setItemStatus('suggestion', suggestionId, 'conflict')
        return 'conflict'
      }
    }
  }
}
