'use client'

import { useEffect, useRef } from 'react'
import { Pause, Play, X } from 'lucide-react'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { showSectorDownloadedToast } from '@/lib/feedback'

/** Phase labels for display */
const PHASE_LABELS: Record<string, string> = {
  metadata: 'Métadonnées...',
  photos: 'Photos...',
  tiles: 'Tuiles carte...',
  complete: 'Terminé !',
}

/**
 * Fixed-position progress card shown during sector downloads.
 *
 * Appears at the bottom of the screen (above map sheet).
 * Shows progress bar, phase label, pause/resume + cancel buttons.
 * Auto-dismisses on completion with a toast notification.
 */
export function DownloadProgress() {
  const activeDownload = useOfflineSectorStore((s) => s.activeDownload)
  const sectors = useOfflineSectorStore((s) => s.sectors)
  const pauseDownload = useOfflineSectorStore((s) => s.pauseDownload)
  const resumeDownload = useOfflineSectorStore((s) => s.resumeDownload)
  const cancelDownload = useOfflineSectorStore((s) => s.cancelDownload)

  const prevPhaseRef = useRef<string | null>(null)

  // Show toast on completion
  useEffect(() => {
    if (!activeDownload) {
      if (prevPhaseRef.current === 'complete') {
        // Download just finished — toast was already triggered
      }
      prevPhaseRef.current = null
      return
    }

    const { phase } = activeDownload.progress
    if (phase === 'complete' && prevPhaseRef.current !== 'complete') {
      showSectorDownloadedToast(activeDownload.sectorName)
    }
    prevPhaseRef.current = phase
  }, [activeDownload])

  if (!activeDownload) return null

  const { sectorName, progress } = activeDownload
  const sectorInfo = sectors[sectorName]
  const isPaused = sectorInfo?.status === 'paused'

  return (
    <div className="fixed inset-x-0 bottom-20 z-30 mx-4 animate-in slide-in-from-bottom-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {sectorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {PHASE_LABELS[progress.phase] ?? progress.phase}
              {progress.totalItems > 0 &&
                ` ${progress.currentItem}/${progress.totalItems}`}
            </p>
          </div>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={isPaused ? resumeDownload : pauseDownload}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={isPaused ? 'Reprendre' : 'Pause'}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={cancelDownload}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Annuler le téléchargement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <p className="mt-1.5 text-right text-[10px] text-muted-foreground">
          {progress.percent}%
        </p>
      </div>
    </div>
  )
}
