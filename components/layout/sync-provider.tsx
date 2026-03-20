'use client'

import { useSyncOnReconnect } from '@/lib/hooks/use-sync-on-reconnect'

/**
 * Invisible provider that triggers background sync on reconnection.
 * Mount once in the app layout.
 */
export function SyncProvider() {
  useSyncOnReconnect()
  return null
}
