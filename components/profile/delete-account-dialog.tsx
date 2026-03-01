'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const CONFIRMATION_WORD = 'SUPPRIMER'

/**
 * Danger zone: account deletion with typed confirmation.
 *
 * The user must type "SUPPRIMER" to enable the delete button.
 * Calls DELETE /api/auth/delete-account, then clears auth state
 * and redirects to home.
 */
export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const isConfirmed = confirmText === CONFIRMATION_WORD

  function handleOpen() {
    setIsOpen(true)
    setConfirmText('')
    setError(null)
  }

  function handleClose() {
    if (isDeleting) return // Prevent closing during deletion
    setIsOpen(false)
    setConfirmText('')
    setError(null)
  }

  async function handleDelete() {
    if (!isConfirmed || isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.')
        setIsDeleting(false)
        return
      }

      // Clear local auth state and redirect
      setUser(null)
      router.push('/')
      router.refresh()
    } catch {
      setError('Impossible de contacter le serveur. Veuillez réessayer.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-background px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 min-touch"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer mon compte
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2 id="delete-dialog-title" className="text-lg font-bold text-foreground">
                  Supprimer le compte
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">Cette action est irréversible.</p>
              <p className="mt-1">
                Toutes vos données personnelles seront définitivement supprimées.
                Vos contributions publiques seront anonymisées.
              </p>
            </div>

            {/* Confirmation input */}
            <div className="mb-4">
              <label htmlFor="delete-confirm" className="mb-1.5 block text-sm text-muted-foreground">
                Tapez <span className="font-mono font-bold text-foreground">{CONFIRMATION_WORD}</span> pour confirmer
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                placeholder={CONFIRMATION_WORD}
                autoComplete="off"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
