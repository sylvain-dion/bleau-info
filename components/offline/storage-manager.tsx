'use client'

import { useState } from 'react'
import { PackageOpen, Trash2, Check } from 'lucide-react'
import { useStorageManager } from '@/lib/hooks/use-storage-manager'
import { formatBytes } from '@/lib/offline/storage-quota'
import {
  showSectorRemovedToast,
  showSectorRemoveErrorToast,
} from '@/lib/feedback'

/**
 * Offline storage dashboard.
 *
 * Shows total quota usage, lists downloaded sector packs with
 * individual delete controls, and refreshes storage estimate
 * after each deletion.
 */
export function StorageManager() {
  const { sectors, totalSectorBytes, estimate, isLoading, removeSector } =
    useStorageManager()

  return (
    <div className="space-y-4">
      <StorageBar estimate={estimate} isLoading={isLoading} />

      {sectors.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {sectors.length} pack{sectors.length > 1 ? 's' : ''} téléchargé
            {sectors.length > 1 ? 's' : ''} •{' '}
            {formatBytes(totalSectorBytes)}
          </p>
          {sectors.map((sector) => (
            <SectorRow
              key={sector.name}
              name={sector.name}
              sizeBytes={sector.sizeBytes}
              downloadedAt={sector.downloadedAt}
              onRemove={removeSector}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StorageBarProps {
  estimate: { usage: number; quota: number; available: number }
  isLoading: boolean
}

function StorageBar({ estimate, isLoading }: StorageBarProps) {
  const hasQuota = estimate.quota > 0
  const percent = hasQuota
    ? Math.min(100, (estimate.usage / estimate.quota) * 100)
    : 0

  const usageColor =
    percent > 90
      ? 'bg-destructive'
      : percent > 70
        ? 'bg-amber-500'
        : 'bg-primary'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {isLoading ? (
            <span className="inline-block h-3 w-20 animate-pulse rounded bg-muted" />
          ) : (
            formatBytes(estimate.usage)
          )}{' '}
          utilisés
        </span>
        {hasQuota && (
          <span className="text-muted-foreground">
            {formatBytes(estimate.available)} disponibles
          </span>
        )}
      </div>

      {hasQuota && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Stockage utilisé : ${Math.round(percent)}%`}
          />
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
      <PackageOpen className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">Aucun pack téléchargé</p>
      <p className="text-xs text-muted-foreground/70">
        Téléchargez un secteur depuis la carte pour y accéder offline.
      </p>
    </div>
  )
}

interface SectorRowProps {
  name: string
  sizeBytes: number
  downloadedAt: string
  onRemove: (name: string) => Promise<number>
}

function SectorRow({ name, sizeBytes, downloadedAt, onRemove }: SectorRowProps) {
  const [confirming, setConfirming] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  function handleTrash() {
    setConfirming(true)
  }

  function handleCancel() {
    setConfirming(false)
  }

  async function handleConfirm() {
    if (isRemoving) return
    setIsRemoving(true)

    try {
      const freed = await onRemove(name)
      showSectorRemovedToast(name, freed)
    } catch {
      setIsRemoving(false)
      setConfirming(false)
      showSectorRemoveErrorToast(name)
    }
  }

  const relativeDate = formatRelativeDate(downloadedAt)

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-opacity ${isRemoving ? 'opacity-50' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(sizeBytes)} • {relativeDate}
        </p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isRemoving}
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRemoving}
            className="flex items-center gap-1 rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            aria-label={`Confirmer la suppression de ${name}`}
          >
            <Check className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTrash}
          disabled={isRemoving}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label={`Supprimer le pack ${name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return 'Date inconnue'

  try {
    const diff = Date.now() - new Date(isoDate).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`
    return `Il y a ${Math.floor(days / 30)} mois`
  } catch {
    return 'Date inconnue'
  }
}
