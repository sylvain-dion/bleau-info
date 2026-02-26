'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Quelque chose s&apos;est mal passé
        </h2>
        <p className="mb-8 text-muted-foreground">
          L&apos;erreur a été signalée automatiquement. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="min-touch rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    </main>
  )
}
