'use client'

import { useSyncOnReconnect } from '@/lib/hooks/use-sync-on-reconnect'
import { usePostResetToast } from '@/lib/hooks/use-post-reset-toast'
import { useCircuitCompletionCheck } from '@/lib/hooks/use-circuit-completion-check'
import { useAchievementWatcher } from '@/lib/hooks/use-achievement-watcher'
import { CircuitCompletionCelebration } from '@/components/ui/circuit-completion-celebration'
import { AchievementCelebration } from '@/components/achievements/achievement-celebration'

/**
 * Invisible provider that triggers background sync on reconnection,
 * shows post-reset toasts, and monitors circuit completions + badge /
 * streak / goal achievements.
 * Mount once in the app layout.
 */
export function SyncProvider() {
  useSyncOnReconnect()
  usePostResetToast()
  useCircuitCompletionCheck()
  useAchievementWatcher()
  return (
    <>
      <CircuitCompletionCelebration />
      <AchievementCelebration />
    </>
  )
}
