/** Sync status for any locally-created item */
export type SyncStatus = 'local' | 'pending' | 'synced' | 'error'

/** Item types that can be synced */
export type SyncItemType = 'draft' | 'suggestion' | 'tick' | 'video'

/** An item in the sync queue */
export interface SyncQueueItem {
  id: string
  type: SyncItemType
  retryCount: number
}

/** Result of a sync pass */
export interface SyncResult {
  synced: number
  failed: number
  total: number
}
