'use client'

import { useState, useMemo } from 'react'
import { Download, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'
import { getAvailableSectors } from '@/lib/offline/sector-data-service'
import { DownloadConfirmationDrawer } from './download-confirmation-drawer'
import type { SectorInfo } from '@/lib/offline/sector-data-service'

interface SectorDownloadButtonProps {
  sectorName: string
}

/**
 * Button to download a sector for offline use.
 *
 * Adapts its appearance based on sector status:
 * - available: dashed "Télécharger pour usage offline"
 * - downloaded: green "Disponible offline ✓" + delete button
 * - update: "Mise à jour disponible" with refresh icon
 * - downloading/paused: hidden (progress component handles this)
 */
export function SectorDownloadButton({
  sectorName,
}: SectorDownloadButtonProps) {
  const sectors = useOfflineSectorStore((s) => s.sectors)
  const removeSector = useOfflineSectorStore((s) => s.removeSector)
  const startDownload = useOfflineSectorStore((s) => s.startDownload)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const sectorInfo = useMemo<SectorInfo | null>(() => {
    const all = getAvailableSectors()
    return all.find((s) => s.name === sectorName) ?? null
  }, [sectorName])

  const status = sectors[sectorName]?.status ?? 'available'

  // Downloading/paused → progress card handles this
  if (status === 'downloading' || status === 'paused') return null

  if (status === 'downloaded') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Disponible offline
        </div>
        <button
          type="button"
          onClick={() => removeSector(sectorName)}
          className="shrink-0 rounded-lg border border-border p-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive min-touch"
          aria-label="Supprimer les données offline"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (status === 'update') {
    return (
      <>
        <button
          type="button"
          onClick={() => startDownload(sectorName)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400 min-touch"
        >
          <RefreshCw className="h-4 w-4" />
          Mise à jour disponible
        </button>
      </>
    )
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 min-touch"
      >
        <Download className="h-4 w-4" />
        Réessayer le téléchargement
      </button>
    )
  }

  // Default: available
  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirmation(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary min-touch"
      >
        <Download className="h-4 w-4" />
        Télécharger pour usage offline
      </button>

      {sectorInfo && (
        <DownloadConfirmationDrawer
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          sectorInfo={sectorInfo}
        />
      )}
    </>
  )
}
