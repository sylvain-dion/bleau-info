'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { EnvironmentalZoneFeature } from '@/lib/data/mock-environmental-zones'

interface EcoWarningDialogProps {
  /** The forbidden zones the boulder sits in. */
  zones: readonly EnvironmentalZoneFeature[]
  /** Confirm callback — proceed with the tick. */
  onConfirm: () => void
  /** Cancel callback — close the dialog and leave the form intact. */
  onCancel: () => void
}

/**
 * Story 14e.1 — Confirmation dialog shown before logging a tick on a
 * boulder that sits inside a `forbidden` environmental zone.
 *
 * Rationale: we don't outright block the user — they may be reporting
 * a climb done before the zone went active, or correcting an old log.
 * Instead we surface the rule, require an explicit acknowledgement,
 * and let them decide. The CTA tone stays destructive to keep the
 * decision deliberate.
 */
export function EcoWarningDialog({
  zones,
  onConfirm,
  onCancel,
}: EcoWarningDialogProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="eco-warning-title"
      data-testid="eco-warning-dialog"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border border-red-200 bg-card p-5 shadow-xl sm:rounded-2xl dark:border-red-900"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2
              id="eco-warning-title"
              className="text-base font-semibold text-foreground"
            >
              Zone protégée
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-foreground">
          Ce bloc se trouve dans une zone où l’escalade est{' '}
          <strong className="text-red-700 dark:text-red-400">interdite</strong>{' '}
          actuellement.
        </p>

        <ul className="mb-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs dark:border-red-900 dark:bg-red-950/30">
          {zones.map((zone) => (
            <li
              key={zone.properties.id}
              data-testid={`eco-warning-zone-${zone.properties.id}`}
            >
              <p className="font-medium text-red-900 dark:text-red-200">
                {zone.properties.title}
              </p>
              <p className="mt-0.5 text-red-800/90 dark:text-red-100/80">
                {zone.properties.description}
              </p>
              {zone.properties.source && (
                <p className="mt-0.5 text-red-700/80 dark:text-red-300/70">
                  Source : {zone.properties.source}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="mb-4 text-xs text-muted-foreground">
          Si vous logez une croix antérieure à la mise en place de cette zone,
          confirmez ci-dessous. Sinon, merci de respecter la fermeture.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            data-testid="eco-warning-cancel"
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-touch"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid="eco-warning-confirm"
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-touch dark:bg-red-700 dark:hover:bg-red-600"
          >
            Confirmer la croix
          </button>
        </div>
      </div>
    </div>
  )
}
