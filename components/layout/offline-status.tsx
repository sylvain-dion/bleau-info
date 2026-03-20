'use client'

import { useNetworkStatus } from '@/lib/hooks/use-network-status'
import { usePendingSyncCount } from '@/lib/hooks/use-pending-sync-count'
import { WifiOff, Download, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineStatus() {
  const { isOffline, hasDownloadedContent } = useNetworkStatus()
  const { pendingCount } = usePendingSyncCount()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show pill when offline, hide when online
    if (isOffline) {
      setShow(true)
    } else {
      // Delay hiding to allow animation to complete
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOffline])

  // Don't render if not shown
  if (!show) return null

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-in-out
        ${isOffline ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="
          flex items-center gap-2 px-4 py-2.5
          bg-zinc-700 dark:bg-zinc-600
          text-white text-sm font-medium
          rounded-full shadow-lg
          backdrop-blur-sm
        "
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">{pendingCount} en attente</span>
            </div>
          </>
        )}
        {hasDownloadedContent && (
          <>
            <span className="text-zinc-300" aria-hidden="true">
              •
            </span>
            <div className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">Zone Downloaded</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
