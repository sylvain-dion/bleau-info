'use client'

import { useState } from 'react'
import { Check, X, MessageSquare, AlertTriangle } from 'lucide-react'
import {
  approveSubmission,
  rejectSubmission,
  requestCorrections,
  REJECTION_REASONS,
  type RejectionReason,
} from '@/lib/moderation/action-service'
import {
  showApprovedToast,
  showRejectedToast,
  showCorrectionsRequestedToast,
} from '@/lib/feedback'
import type { QueueItem } from '@/lib/moderation/queue-service'

interface ModerationActionsProps {
  item: QueueItem
  onActionComplete: () => void
}

/**
 * Moderation action buttons: Approve / Reject / Request Corrections.
 *
 * Reject and corrections open inline forms before confirming.
 */
export function ModerationActions({ item, onActionComplete }: ModerationActionsProps) {
  const [mode, setMode] = useState<'idle' | 'reject' | 'corrections'>('idle')

  function handleApprove() {
    const result = approveSubmission(item)
    if (result.success) {
      showApprovedToast(item.name)
      onActionComplete()
    }
  }

  return (
    <div className="border-t border-border">
      {mode === 'idle' && (
        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={handleApprove}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            Valider
          </button>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
            Rejeter
          </button>
          <button
            type="button"
            onClick={() => setMode('corrections')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-background px-3 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            <MessageSquare className="h-4 w-4" />
            Corrections
          </button>
        </div>
      )}

      {mode === 'reject' && (
        <RejectForm
          item={item}
          onCancel={() => setMode('idle')}
          onConfirm={onActionComplete}
        />
      )}

      {mode === 'corrections' && (
        <CorrectionsForm
          item={item}
          onCancel={() => setMode('idle')}
          onConfirm={onActionComplete}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reject form
// ---------------------------------------------------------------------------

function RejectForm({
  item,
  onCancel,
  onConfirm,
}: {
  item: QueueItem
  onCancel: () => void
  onConfirm: () => void
}) {
  const [reason, setReason] = useState<RejectionReason>('duplicate')
  const [comment, setComment] = useState('')

  function handleSubmit() {
    const result = rejectSubmission(item, reason, comment)
    if (result.success) {
      showRejectedToast(item.name)
      onConfirm()
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Rejeter cette soumission
      </div>

      {/* Reason selector */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-foreground">
          Raison du rejet
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {REJECTION_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                reason === r.value
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Optional comment */}
      <div className="mb-3">
        <label
          htmlFor="reject-comment"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Commentaire (optionnel)
        </label>
        <textarea
          id="reject-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Expliquez la raison du rejet..."
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
        >
          Confirmer le rejet
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Corrections form
// ---------------------------------------------------------------------------

function CorrectionsForm({
  item,
  onCancel,
  onConfirm,
}: {
  item: QueueItem
  onCancel: () => void
  onConfirm: () => void
}) {
  const [instructions, setInstructions] = useState('')

  function handleSubmit() {
    if (!instructions.trim()) return
    const result = requestCorrections(item, instructions)
    if (result.success) {
      showCorrectionsRequestedToast(item.name)
      onConfirm()
    }
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
        <MessageSquare className="h-4 w-4" />
        Demander des corrections
      </div>

      <div className="mb-3">
        <label
          htmlFor="corrections-instructions"
          className="mb-1 block text-xs font-medium text-foreground"
        >
          Instructions pour l&apos;auteur
        </label>
        <textarea
          id="corrections-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Décrivez les corrections nécessaires..."
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!instructions.trim()}
          className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
