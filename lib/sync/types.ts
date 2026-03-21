/** Sync status for any locally-created item */
export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict' | 'error'

/** Item types that can be synced */
export type SyncItemType = 'draft' | 'suggestion' | 'tick' | 'video'

/** An item in the sync queue */
export interface SyncQueueItem {
  id: string
  type: SyncItemType
  retryCount: number
}

/** Result of a full sync pass */
export interface SyncResult {
  synced: number
  failed: number
  conflicts: number
  total: number
}

// ---------------------------------------------------------------------------
// Conflict Detection (Story 6.5)
// ---------------------------------------------------------------------------

/** Response from a single sync adapter call */
export interface SyncItemResponse {
  status: 'synced' | 'conflict'
  conflict?: ConflictInfo
}

/** Server-side conflict information returned by the adapter */
export interface ConflictInfo {
  remoteVersion: Record<string, unknown>
  remoteUpdatedAt: string
}

/** Conflict classification after analysis */
export type ConflictType = 'none' | 'lww-resolved' | 'geographic'

/** A single field difference between local and remote */
export interface FieldDiff {
  field: string
  localValue: unknown
  remoteValue: unknown
}

/** Resolution outcome for a conflict */
export type ConflictResolution =
  | 'pending'
  | 'keep-local'
  | 'keep-remote'
  | 'sent-to-moderation'

/** A stored conflict record requiring user attention */
export interface ConflictRecord {
  id: string
  suggestionId: string
  boulderId: string
  boulderName: string
  conflictType: ConflictType
  diffs: FieldDiff[]
  localVersion: Record<string, unknown>
  remoteVersion: Record<string, unknown>
  distanceMeters: number | null
  resolution: ConflictResolution
  createdAt: string
  resolvedAt: string | null
}

/** Output from classifyConflict() */
export interface ConflictClassification {
  type: ConflictType
  diffs: FieldDiff[]
  distanceMeters: number | null
}
