'use client'

import { useEffect, useRef } from 'react'
import { SyncManager } from '@/lib/sync/sync-manager'
import { MockSyncAdapter } from '@/lib/sync/mock-sync-adapter'
import { useNetworkStore } from '@/stores/network-store'
import {
  showSyncStartedToast,
  showSyncCompleteToast,
  showSyncPartialToast,
  showConflictDetectedToast,
} from '@/lib/feedback'
import { usePendingSyncCount } from './use-pending-sync-count'

/**
 * Triggers sync when connectivity returns.
 *
 * - Listens to `online` event via network store
 * - Also syncs on mount if online + pending items
 * - Debounces rapid reconnections (500ms)
 * - Shows toasts for sync results
 */
export function useSyncOnReconnect(): void {
  const isOnline = useNetworkStore((s) => s.isOnline)
  const { hasPending } = usePendingSyncCount()
  const managerRef = useRef<SyncManager | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevOnlineRef = useRef(isOnline)

  // Lazy-init the sync manager
  if (!managerRef.current) {
    managerRef.current = new SyncManager(new MockSyncAdapter())
  }

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current
    prevOnlineRef.current = isOnline

    // Trigger sync when: just came online + has pending items
    const shouldSync = isOnline && hasPending && wasOffline

    // Also sync on first mount if online + pending
    const isInitialMount = wasOffline === false && isOnline && hasPending

    if (!shouldSync && !isInitialMount) return

    // Debounce rapid reconnections
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      const manager = managerRef.current
      if (!manager || manager.running) return

      showSyncStartedToast()

      const result = await manager.syncAll()

      if (result.total === 0) return

      if (result.conflicts > 0) {
        showConflictDetectedToast(result.conflicts)
      }

      if (result.failed === 0 && result.conflicts === 0) {
        showSyncCompleteToast(result.synced)
      } else if (result.failed > 0) {
        showSyncPartialToast(result.synced, result.failed)
      } else if (result.synced > 0) {
        showSyncCompleteToast(result.synced)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [isOnline, hasPending])
}
