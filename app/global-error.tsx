'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="fr">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: '#71717a', marginBottom: '2rem' }}>
            L&apos;erreur a été signalée automatiquement.
          </p>
          <button
            onClick={reset}
            style={{ minHeight: '48px', minWidth: '48px', padding: '0.75rem 1.5rem', backgroundColor: '#FF6B00', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
