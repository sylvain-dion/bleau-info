'use client'

import { useState } from 'react'
import { AlertTriangle, MapPin, CheckCircle2 } from 'lucide-react'
import { useConflictStore } from '@/stores/conflict-store'
import { ConflictResolutionDialog } from './conflict-resolution-dialog'
import type { ConflictRecord } from '@/lib/sync/types'

/**
 * Lists unresolved geographic conflicts on the profile page.
 *
 * Each conflict shows the boulder name, distance discrepancy,
 * and a "Résoudre" button that opens the side-by-side dialog.
 */
export function ConflictList() {
  const conflicts = useConflictStore((s) => s.conflicts)
  const unresolved = conflicts.filter((c) => c.resolution === 'pending')
  const resolved = conflicts.filter((c) => c.resolution !== 'pending')

  const [activeConflict, setActiveConflict] = useState<ConflictRecord | null>(
    null
  )

  if (conflicts.length === 0) return null

  return (
    <>
      {unresolved.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-medium">
              {unresolved.length} conflit{unresolved.length > 1 ? 's' : ''} à
              résoudre
            </span>
          </div>

          {unresolved.map((conflict) => (
            <ConflictRow
              key={conflict.id}
              conflict={conflict}
              onResolve={setActiveConflict}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground">
            {resolved.length} résolu{resolved.length > 1 ? 's' : ''}
          </p>
          {resolved.slice(0, 3).map((conflict) => (
            <div
              key={conflict.id}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="truncate">{conflict.boulderName}</span>
              <span className="ml-auto shrink-0 text-[10px]">
                {formatResolution(conflict.resolution)}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeConflict && (
        <ConflictResolutionDialog
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ConflictRowProps {
  conflict: ConflictRecord
  onResolve: (conflict: ConflictRecord) => void
}

function ConflictRow({ conflict, onResolve }: ConflictRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {conflict.boulderName}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>
            Écart de {conflict.distanceMeters ?? '?'} m
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onResolve(conflict)}
        className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
      >
        Résoudre
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatResolution(resolution: string): string {
  switch (resolution) {
    case 'keep-local':
      return 'Version locale'
    case 'keep-remote':
      return 'Version serveur'
    case 'sent-to-moderation':
      return 'En modération'
    default:
      return resolution
  }
}
