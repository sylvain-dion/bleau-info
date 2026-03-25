'use client'

import { useSyncOnReconnect } from '@/lib/hooks/use-sync-on-reconnect'
import { usePostResetToast } from '@/lib/hooks/use-post-reset-toast'
import { useCircuitCompletionCheck } from '@/lib/hooks/use-circuit-completion-check'
import { CircuitCompletionCelebration } from '@/components/ui/circuit-completion-celebration'

/**
 * Invisible provider that triggers background sync on reconnection,
 * shows post-reset toasts, and monitors circuit completions.
 * Mount once in the app layout.
 */
export function SyncProvider() {
  useSyncOnReconnect()
  usePostResetToast()
  useCircuitCompletionCheck()
  return <CircuitCompletionCelebration />
}
