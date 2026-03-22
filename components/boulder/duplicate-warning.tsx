'use client'

import { AlertTriangle, MapPin, Check, X } from 'lucide-react'
import type { DuplicateCandidate } from '@/lib/detection/duplicate-detector'
import { DUPLICATE_RADIUS_METERS } from '@/lib/detection/duplicate-detector'

interface DuplicateWarningProps {
  candidates: DuplicateCandidate[]
  onDismiss: () => void
  onCancel: () => void
}

/**
 * Warning banner shown when nearby boulders are detected.
 *
 * Shows a list of potential duplicates with distance.
 * User can dismiss ("it's a different boulder") or cancel creation.
 */
export function DuplicateWarning({
  candidates,
  onDismiss,
  onCancel,
}: DuplicateWarningProps) {
  if (candidates.length === 0) return null

  const exactDuplicates = candidates.filter(
    (c) => c.distanceMeters <= DUPLICATE_RADIUS_METERS
  )
  const nearbyOnly = candidates.filter(
    (c) => c.distanceMeters > DUPLICATE_RADIUS_METERS
  )

  const isExact = exactDuplicates.length > 0

  return (
    <div
      className={`rounded-lg border p-4 ${
        isExact
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20'
      }`}
      role="alert"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-2">
        <AlertTriangle
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            isExact ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
          }`}
        />
        <div>
          <p
            className={`text-sm font-semibold ${
              isExact ? 'text-destructive' : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            {isExact
              ? `${exactDuplicates.length} bloc${exactDuplicates.length > 1 ? 's' : ''} identique${exactDuplicates.length > 1 ? 's' : ''} trouvé${exactDuplicates.length > 1 ? 's' : ''}`
              : `${candidates.length} bloc${candidates.length > 1 ? 's' : ''} similaire${candidates.length > 1 ? 's' : ''} à proximité`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isExact
              ? 'Un bloc existe déjà à cet emplacement exact.'
              : 'Vérifiez que votre bloc n\u2019existe pas déjà.'}
          </p>
        </div>
      </div>

      {/* Candidate list */}
      <div className="mb-3 space-y-1.5">
        {exactDuplicates.map((c) => (
          <CandidateRow key={c.id} candidate={c} isExact />
        ))}
        {nearbyOnly.slice(0, 3).map((c) => (
          <CandidateRow key={c.id} candidate={c} />
        ))}
        {nearbyOnly.length > 3 && (
          <p className="px-3 text-xs text-muted-foreground">
            + {nearbyOnly.length - 3} autre{nearbyOnly.length - 3 > 1 ? 's' : ''} bloc{nearbyOnly.length - 3 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
          C&apos;est le même bloc
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Check className="h-3.5 w-3.5" />
          Non, c&apos;est un autre
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CandidateRow({
  candidate,
  isExact,
}: {
  candidate: DuplicateCandidate
  isExact?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-3 py-2 ${
        isExact
          ? 'bg-destructive/10'
          : 'bg-background'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {candidate.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {candidate.grade} · {candidate.sector}
          {candidate.source === 'draft' && ' (brouillon)'}
        </p>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {candidate.distanceMeters} m
      </div>
    </div>
  )
}
