'use client'

import { useSyncOnReconnect } from '@/lib/hooks/use-sync-on-reconnect'
import { usePostResetToast } from '@/lib/hooks/use-post-reset-toast'

/**
 * Invisible provider that triggers background sync on reconnection
 * and shows post-reset toasts. Mount once in the app layout.
 */
export function SyncProvider() {
  useSyncOnReconnect()
  usePostResetToast()
  return null
}
