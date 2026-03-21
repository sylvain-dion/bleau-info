'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { performHardReset } from '@/lib/offline/hard-reset'

/**
 * Danger zone: clear all local caches and reload.
 *
 * Opens a confirmation modal, calls performHardReset(),
 * then reloads the page. A post-reload toast is triggered
 * via a localStorage flag.
 */
export function HardResetDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setIsOpen(true)
    setError(null)
  }

  function handleClose() {
    if (isResetting) return
    setIsOpen(false)
    setError(null)
  }

  async function handleConfirm() {
    if (isResetting) return

    setIsResetting(true)
    setError(null)

    const result = await performHardReset()

    if (result.success) {
      window.location.reload()
    } else {
      setError(result.error ?? 'Une erreur est survenue.')
      setIsResetting(false)
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
        Vider le cache et resynchroniser
      </button>

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
            aria-labelledby="reset-dialog-title"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h2
                  id="reset-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  Réinitialisation complète
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isResetting}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">
                Cela supprimera toutes les données locales.
              </p>
              <p className="mt-1">
                Les packs offline, les brouillons non synchronisés et les photos
                en cache seront effacés. Vos données de compte sont conservées.
              </p>
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
                disabled={isResetting}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isResetting}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isResetting ? 'Réinitialisation...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
