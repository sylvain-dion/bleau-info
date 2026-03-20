'use client'

import { useState, useEffect } from 'react'
import { Drawer } from 'vaul'
import { Download, HardDrive } from 'lucide-react'
import { getStorageEstimate, formatBytes } from '@/lib/offline/storage-quota'
import type { SectorInfo } from '@/lib/offline/sector-data-service'
import { useOfflineSectorStore } from '@/stores/offline-sector-store'

interface DownloadConfirmationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectorInfo: SectorInfo
}

/**
 * Bottom-sheet drawer confirming sector download.
 *
 * Shows: sector name, boulder count, estimated size, available storage.
 * "Télécharger" button triggers the download via the store.
 */
export function DownloadConfirmationDrawer({
  open,
  onOpenChange,
  sectorInfo,
}: DownloadConfirmationDrawerProps) {
  const startDownload = useOfflineSectorStore((s) => s.startDownload)
  const [availableStorage, setAvailableStorage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    getStorageEstimate().then((estimate) => {
      if (estimate.available > 0) {
        setAvailableStorage(formatBytes(estimate.available))
      }
    })
  }, [open])

  function handleDownload() {
    startDownload(sectorInfo.name)
    onOpenChange(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border bg-background shadow-xl outline-none">
          <Drawer.Title className="sr-only">
            Télécharger {sectorInfo.name}
          </Drawer.Title>

          {/* Drag handle */}
          <div className="flex shrink-0 justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="px-4 pb-8">
            <h3 className="text-base font-semibold text-foreground">
              Télécharger pour usage offline
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Les données du secteur seront disponibles sans connexion.
            </p>

            {/* Info grid */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoCard label="Secteur" value={sectorInfo.name} />
              <InfoCard
                label="Blocs"
                value={String(sectorInfo.boulderCount)}
              />
              <InfoCard
                label="Topos"
                value={String(sectorInfo.topoCount)}
              />
              <InfoCard
                label="Taille estimée"
                value={formatBytes(sectorInfo.estimatedSizeBytes)}
              />
            </div>

            {/* Storage info */}
            {availableStorage && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span>Espace disponible : {availableStorage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-touch"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 min-touch"
              >
                <Download className="h-4 w-4" />
                Télécharger
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
