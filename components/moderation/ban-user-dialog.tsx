'use client'

import { useState } from 'react'
import { ShieldOff, ShieldCheck, AlertTriangle, Clock, X } from 'lucide-react'
import {
  performBan,
  performSuspension,
  performUnban,
} from '@/lib/moderation/ban-service'
import { toast } from 'sonner'

interface BanUserDialogProps {
  userId: string
  displayName: string
  isRestricted: boolean
  onClose: () => void
  onComplete: () => void
}

/**
 * Dialog for banning/suspending a user or lifting restrictions.
 */
export function BanUserDialog({
  userId,
  displayName,
  isRestricted,
  onClose,
  onComplete,
}: BanUserDialogProps) {
  const [mode, setMode] = useState<'ban' | 'suspend'>('ban')
  const [reason, setReason] = useState('')
  const [suspendDays, setSuspendDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleBan() {
    if (!reason.trim()) return
    setIsSubmitting(true)

    const result = performBan(userId, displayName, reason, 'moderator-local')
    if (result.success) {
      toast.error(`${displayName} — droits de contribution suspendus`, {
        duration: 5000,
      })
      onComplete()
    }
    setIsSubmitting(false)
  }

  function handleSuspend() {
    if (!reason.trim()) return
    setIsSubmitting(true)

    const until = new Date(
      Date.now() + suspendDays * 24 * 60 * 60 * 1000
    ).toISOString()
    const result = performSuspension(
      userId,
      displayName,
      until,
      reason,
      'moderator-local'
    )
    if (result.success) {
      toast.warning(
        `${displayName} — suspendu pour ${suspendDays} jour${suspendDays > 1 ? 's' : ''}`,
        { duration: 5000 }
      )
      onComplete()
    }
    setIsSubmitting(false)
  }

  function handleUnban() {
    const result = performUnban(userId, displayName, 'moderator-local')
    if (result.success) {
      toast.success(`${displayName} — droits rétablis`, { duration: 4000 })
      onComplete()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ban-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              {isRestricted ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <ShieldOff className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <h2
                id="ban-dialog-title"
                className="text-lg font-bold text-foreground"
              >
                {isRestricted ? 'Réhabiliter' : 'Suspendre'}
              </h2>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
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
        <div className="p-5">
          {isRestricted ? (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                Rétablir les droits de contribution de cet utilisateur ?
              </p>
              <button
                type="button"
                onClick={handleUnban}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <ShieldCheck className="h-4 w-4" />
                Réhabiliter l&apos;utilisateur
              </button>
            </div>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('ban')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'ban'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  Ban permanent
                </button>
                <button
                  type="button"
                  onClick={() => setMode('suspend')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    mode === 'suspend'
                      ? 'bg-amber-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Suspension
                </button>
              </div>

              {/* Warning */}
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p className="font-medium">
                    {mode === 'ban'
                      ? 'Le ban est permanent. Les soumissions en attente seront rejetées.'
                      : `Suspension de ${suspendDays} jours. Les soumissions en attente seront rejetées.`}
                  </p>
                </div>
              </div>

              {/* Suspension duration */}
              {mode === 'suspend' && (
                <div className="mb-4">
                  <label
                    htmlFor="suspend-days"
                    className="mb-1 block text-xs font-medium text-foreground"
                  >
                    Durée (jours)
                  </label>
                  <select
                    id="suspend-days"
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value={1}>1 jour</option>
                    <option value={3}>3 jours</option>
                    <option value={7}>7 jours</option>
                    <option value={14}>14 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                  </select>
                </div>
              )}

              {/* Reason */}
              <div className="mb-4">
                <label
                  htmlFor="ban-reason"
                  className="mb-1 block text-xs font-medium text-foreground"
                >
                  Raison (obligatoire)
                </label>
                <textarea
                  id="ban-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Décrivez le comportement problématique..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={mode === 'ban' ? handleBan : handleSuspend}
                  disabled={!reason.trim() || isSubmitting}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    mode === 'ban'
                      ? 'bg-destructive hover:bg-destructive/90'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {mode === 'ban' ? 'Confirmer le ban' : 'Confirmer la suspension'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
