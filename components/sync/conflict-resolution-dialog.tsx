'use client'

import { X, MapPin, ArrowRight, User, Server, Flag } from 'lucide-react'
import { useConflictStore } from '@/stores/conflict-store'
import { showConflictResolvedToast } from '@/lib/feedback'
import type { ConflictRecord, ConflictResolution, FieldDiff } from '@/lib/sync/types'

interface ConflictResolutionDialogProps {
  conflict: ConflictRecord
  onClose: () => void
}

/**
 * Side-by-side conflict resolution modal.
 *
 * Shows local vs remote values for each differing field.
 * Geographic fields highlighted when distance > threshold.
 * User picks: keep local, keep remote, or send to moderation.
 */
export function ConflictResolutionDialog({
  conflict,
  onClose,
}: ConflictResolutionDialogProps) {
  const resolveConflict = useConflictStore((s) => s.resolveConflict)

  function handleResolve(resolution: ConflictResolution) {
    resolveConflict(conflict.id, resolution)
    showConflictResolvedToast()
    onClose()
  }

  const geoDiffs = conflict.diffs.filter(
    (d) => d.field === 'latitude' || d.field === 'longitude'
  )
  const otherDiffs = conflict.diffs.filter(
    (d) => d.field !== 'latitude' && d.field !== 'longitude'
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2
              id="conflict-dialog-title"
              className="text-lg font-bold text-foreground"
            >
              Conflit géographique
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {conflict.boulderName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {/* Distance badge */}
          {conflict.distanceMeters != null && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                Écart de <strong>{conflict.distanceMeters} m</strong> entre les
                deux positions (seuil : 10 m)
              </span>
            </div>
          )}

          {/* Geographic diffs */}
          {geoDiffs.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                Position GPS
              </h3>
              <div className="space-y-2">
                {geoDiffs.map((diff) => (
                  <DiffRow key={diff.field} diff={diff} isGeo />
                ))}
              </div>
            </div>
          )}

          {/* Other diffs */}
          {otherDiffs.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Autres champs modifiés
              </h3>
              <div className="space-y-2">
                {otherDiffs.map((diff) => (
                  <DiffRow key={diff.field} diff={diff} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border p-5">
          <button
            type="button"
            onClick={() => handleResolve('keep-local')}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <User className="h-4 w-4" />
            Garder ma version
          </button>
          <button
            type="button"
            onClick={() => handleResolve('keep-remote')}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Server className="h-4 w-4" />
            Garder la version serveur
          </button>
          <button
            type="button"
            onClick={() => handleResolve('sent-to-moderation')}
            className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50"
          >
            <Flag className="h-4 w-4" />
            Envoyer en modération
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DiffRowProps {
  diff: FieldDiff
  isGeo?: boolean
}

function DiffRow({ diff, isGeo }: DiffRowProps) {
  const borderColor = isGeo
    ? 'border-destructive/30'
    : 'border-border'

  return (
    <div className={`rounded-lg border ${borderColor} p-3`}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {FIELD_LABELS[diff.field] ?? diff.field}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 rounded bg-primary/10 px-2 py-1 text-primary">
          <span className="text-[10px] text-muted-foreground">Ma version</span>
          <p className="font-mono text-xs">{formatValue(diff.localValue)}</p>
        </div>
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <div className="flex-1 rounded bg-muted px-2 py-1">
          <span className="text-[10px] text-muted-foreground">Serveur</span>
          <p className="font-mono text-xs">{formatValue(diff.remoteValue)}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  name: 'Nom',
  grade: 'Cotation',
  style: 'Style',
  sector: 'Secteur',
  exposure: 'Exposition',
  strollerAccessible: 'Accès poussette',
  description: 'Description',
  height: 'Hauteur',
  latitude: 'Latitude',
  longitude: 'Longitude',
}

function formatValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6)
  }
  return String(value)
}
