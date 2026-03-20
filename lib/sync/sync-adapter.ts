/**
 * Interface for sync operations.
 *
 * Each method uploads a single item to the server.
 * Throws on failure (network error, server error, etc.).
 * Swap MockSyncAdapter for a real Supabase implementation later.
 */
export interface SyncAdapter {
  syncDraft(id: string): Promise<void>
  syncSuggestion(id: string): Promise<void>
  syncTick(id: string): Promise<void>
  syncVideo(id: string): Promise<void>
}
