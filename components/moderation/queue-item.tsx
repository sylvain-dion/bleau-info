'use client'

import {
  AlertTriangle,
  Camera,
  Clock,
  FileEdit,
  FilePlus2,
} from 'lucide-react'
import type { QueueItem } from '@/lib/moderation/queue-service'
import { PresenceBadge } from './presence-badge'

interface QueueItemCardProps {
  item: QueueItem
  /** Name of another moderator reviewing this item (if any) */
  reviewerName?: string
  onSelect: (item: QueueItem) => void
}

/**
 * A single submission card in the moderation queue.
 *
 * Shows: name, grade, sector, author, date, reason, photo indicator.
 * Potential duplicates get a distinct red accent.
 */
export function QueueItemCard({ item, reviewerName, onSelect }: QueueItemCardProps) {
  const isUrgent = item.potentialDuplicate

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted ${
        isUrgent
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border bg-card'
      }`}
    >
      {/* Photo thumbnail placeholder */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
          item.hasPhoto
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {item.hasPhoto ? (
          <Camera className="h-5 w-5" />
        ) : (
          <span className="text-xs">—</span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.grade} · {item.sector} · {item.style}
            </p>
          </div>
          <TypeBadge type={item.type} />
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* Reason */}
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              isUrgent
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {isUrgent ? (
              <AlertTriangle className="h-3 w-3" />
            ) : item.type === 'creation' ? (
              <FilePlus2 className="h-3 w-3" />
            ) : (
              <FileEdit className="h-3 w-3" />
            )}
            {item.reason}
          </span>

          {/* Date */}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(item.submittedAt)}
          </span>

          {/* Presence indicator */}
          {reviewerName && <PresenceBadge reviewerName={reviewerName} />}
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: 'creation' | 'modification' }) {
  const config =
    type === 'creation'
      ? { label: 'Création', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
      : { label: 'Modification', className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' }

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(isoString: string): string {
  const now = Date.now()
  const date = new Date(isoString).getTime()
  const diffMs = now - date

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`

  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
