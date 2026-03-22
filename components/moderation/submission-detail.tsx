'use client'

import { useMemo, useState } from 'react'
import { X, Eye, GitCompare, MapPin, ArrowRight } from 'lucide-react'
import { buildSubmissionDiff, type DiffField } from '@/lib/moderation/diff-service'
import type { QueueItem } from '@/lib/moderation/queue-service'
import { MiniMapDiff } from './mini-map-diff'

type ViewMode = 'side-by-side' | 'unified'

interface SubmissionDetailProps {
  item: QueueItem
  onClose: () => void
}

/**
 * Side-by-side comparison view for a moderation submission.
 *
 * Shows original (left) vs proposed (right) for modifications,
 * or just proposed values for new creations.
 * Changed fields are highlighted. Geographic fields show a mini-map.
 */
export function SubmissionDetail({ item, onClose }: SubmissionDetailProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')
  const diff = useMemo(() => buildSubmissionDiff(item), [item])

  const changedFields = diff.fields.filter((f) => f.changed)
  const unchangedFields = diff.fields.filter((f) => !f.changed && !f.isGeo)
  const geoFields = diff.fields.filter((f) => f.isGeo)
  const hasGeoChange = geoFields.some((f) => f.changed)

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="truncate text-sm font-bold text-foreground">
              {diff.isCreation ? 'Nouveau bloc' : 'Modification proposée'}
            </h3>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {changedFields.length} champ{changedFields.length !== 1 ? 's' : ''} modifié{changedFields.length !== 1 ? 's' : ''}
            </span>
          </div>
          {diff.originalName && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Bloc original : {diff.originalName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          {!diff.isCreation && (
            <div className="mr-2 flex rounded-md border border-border">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`rounded-l-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                aria-label="Vue côte-à-côte"
              >
                <GitCompare className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`rounded-r-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                aria-label="Vue unifiée"
              >
                Diff
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto">
        {diff.fields.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Données non disponibles.
          </div>
        ) : viewMode === 'side-by-side' ? (
          <SideBySideView
            changedFields={changedFields}
            unchangedFields={unchangedFields}
            isCreation={diff.isCreation}
          />
        ) : (
          <UnifiedView fields={changedFields} />
        )}

        {/* Mini-map for geographic changes */}
        {hasGeoChange && diff.proposedCoords && (
          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
              <MapPin className="h-3 w-3" />
              Comparaison GPS
            </div>
            <MiniMapDiff
              original={diff.originalCoords}
              proposed={diff.proposedCoords}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Side-by-side view
// ---------------------------------------------------------------------------

function SideBySideView({
  changedFields,
  unchangedFields,
  isCreation,
}: {
  changedFields: DiffField[]
  unchangedFields: DiffField[]
  isCreation: boolean
}) {
  return (
    <div className="divide-y divide-border">
      {/* Column headers */}
      {!isCreation && (
        <div className="grid grid-cols-2 gap-px bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Version actuelle</span>
          <span>Version proposée</span>
        </div>
      )}

      {/* Changed fields */}
      {changedFields.map((field) => (
        <div
          key={field.key}
          className="grid grid-cols-2 gap-px bg-amber-50/50 dark:bg-amber-950/10"
        >
          <div className="px-4 py-2.5">
            <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
              {field.label}
            </p>
            <p className="mt-0.5 text-sm text-foreground/60">
              {formatFieldValue(field.original)}
            </p>
          </div>
          <div className="border-l border-border px-4 py-2.5">
            <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
              {field.label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatFieldValue(field.proposed)}
            </p>
          </div>
        </div>
      ))}

      {/* Unchanged fields (collapsed) */}
      {unchangedFields.length > 0 && !isCreation && (
        <details className="group">
          <summary className="cursor-pointer px-4 py-2 text-[10px] text-muted-foreground hover:bg-muted/30">
            {unchangedFields.length} champ{unchangedFields.length !== 1 ? 's' : ''} inchangé{unchangedFields.length !== 1 ? 's' : ''}
          </summary>
          <div className="divide-y divide-border/50">
            {unchangedFields.map((field) => (
              <div key={field.key} className="grid grid-cols-2 gap-px">
                <div className="px-4 py-2">
                  <p className="text-[10px] text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/70">
                    {formatFieldValue(field.original)}
                  </p>
                </div>
                <div className="border-l border-border px-4 py-2">
                  <p className="text-[10px] text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/70">
                    {formatFieldValue(field.proposed)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Unified (git-style) diff view
// ---------------------------------------------------------------------------

function UnifiedView({ fields }: { fields: DiffField[] }) {
  if (fields.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
        Aucun champ modifié.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border font-mono text-xs">
      {fields.map((field) => (
        <div key={field.key} className="px-4 py-1.5">
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
            {field.label}
          </p>
          <div className="flex items-start gap-2 rounded bg-red-50 px-2 py-1 text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <span className="shrink-0 select-none">−</span>
            <span>{formatFieldValue(field.original)}</span>
          </div>
          <div className="mt-0.5 flex items-start gap-2 rounded bg-green-50 px-2 py-1 text-green-700 dark:bg-green-950/20 dark:text-green-400">
            <span className="shrink-0 select-none">+</span>
            <span>{formatFieldValue(field.proposed)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFieldValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(6)
  }
  return String(value)
}
