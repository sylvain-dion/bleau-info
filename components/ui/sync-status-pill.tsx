import type { SyncStatus } from '@/lib/sync/types'

const SYNC_STATUS_CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  local: {
    label: 'Local',
    className: 'bg-muted text-muted-foreground',
  },
  pending: {
    label: 'En attente',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  synced: {
    label: 'Synchronisé',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  conflict: {
    label: 'Conflit',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  error: {
    label: 'Erreur',
    className: 'bg-destructive/10 text-destructive',
  },
}

export function SyncStatusPill({ syncStatus }: { syncStatus: SyncStatus }) {
  const config = SYNC_STATUS_CONFIG[syncStatus] ?? SYNC_STATUS_CONFIG.local
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}
      data-testid="sync-status-pill"
    >
      {config.label}
    </span>
  )
}
