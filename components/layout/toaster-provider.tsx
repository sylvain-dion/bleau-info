'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/lib/hooks/use-theme'

/**
 * App-wide toast notification provider.
 *
 * Placed in the root layout. Follows the current theme
 * (light/dark) automatically via our custom useTheme hook.
 */
export function ToasterProvider() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{
        duration: 3000,
      }}
    />
  )
}
