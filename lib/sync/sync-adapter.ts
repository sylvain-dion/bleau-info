/**
 * Interface for sync operations.
 *
 * Each method uploads a single item to the server and returns
 * a response indicating success or conflict.
 * Throws on failure (network error, server error, etc.).
 * Swap MockSyncAdapter for a real Supabase implementation later.
 */

import type { SyncItemResponse } from './types'

export interface SyncAdapter {
  syncDraft(id: string): Promise<SyncItemResponse>
  syncSuggestion(id: string): Promise<SyncItemResponse>
  syncTick(id: string): Promise<SyncItemResponse>
  syncVideo(id: string): Promise<SyncItemResponse>
}
