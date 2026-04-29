'use client'

import { useEffect } from 'react'
import { AlertTriangle, X, Info } from 'lucide-react'
import type { ContributionStatus } from '@/lib/contributions-hub'

export interface ContributionDeleteTarget {
  /** Title shown in the dialog body. */
  title: string
  /** Hub status of the entity — gates messaging + button label. */
  status: ContributionStatus
}

interface ContributionDeleteDialogProps {
  open: boolean
  target: ContributionDeleteTarget | null
  onOpenChange: (open: boolean) => void
  /**
   * Confirmed by the user. Returns the resulting action so the caller
   * can show a toast — `'pending'` means the entry is publicly visible
   * and the deletion was queued for moderation.
   */
  onConfirm: () => 'removed' | 'pending' | 'noop'
}

/**
 * Soft-delete confirmation dialog for the contributions hub (Story 5.8).
 *
 * For "online" entries, the user is told that moderation must approve
 * the removal before it disappears publicly. For drafts/pending/refusé
 * entries, the dialog simply confirms a local removal.
 */
export function ContributionDeleteDialog({
  open,
  target,
  onOpenChange,
  onConfirm,
}: ContributionDeleteDialogProps) {
  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  if (!open || !target) return null

  const isOnline = target.status === 'online'
  const isPending = target.status === 'pending_deletion'
  const confirmLabel = isOnline ? 'Demander la suppression' : 'Supprimer'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
      data-testid="contribution-delete-dialog"
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contribution-delete-title"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isOnline
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {isOnline ? (
                <Info className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <h2
              id="contribution-delete-title"
              className="text-lg font-bold text-foreground"
            >
              {isOnline ? 'Demander la suppression' : 'Supprimer'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-sm text-foreground">
          <span className="font-medium">{target.title}</span>
        </p>

        {isPending ? (
          <p className="mb-5 text-sm text-muted-foreground">
            Une demande de suppression est déjà en cours pour cette
            contribution. La modération la traitera dès que possible.
          </p>
        ) : isOnline ? (
          <p className="mb-5 text-sm text-muted-foreground">
            Cette contribution est publique. Pour la retirer, l&apos;équipe
            de modération doit valider la demande. Elle restera visible
            avec la mention « Suppression en attente » jusqu&apos;à
            traitement.
          </p>
        ) : (
          <p className="mb-5 text-sm text-muted-foreground">
            La contribution sera retirée immédiatement de votre appareil.
            Cette action est définitive.
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            data-testid="contribution-delete-cancel"
          >
            Annuler
          </button>
          {!isPending && (
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isOnline
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
              data-testid="contribution-delete-confirm"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
