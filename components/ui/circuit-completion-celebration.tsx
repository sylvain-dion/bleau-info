'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { create } from 'zustand'

/** Ephemeral store to trigger celebration from anywhere */
interface CelebrationState {
  circuitName: string | null
  trigger: (name: string) => void
  dismiss: () => void
}

export const useCelebrationStore = create<CelebrationState>((set) => ({
  circuitName: null,
  trigger: (name) => set({ circuitName: name }),
  dismiss: () => set({ circuitName: null }),
}))

/**
 * Full-screen celebration overlay when a circuit is completed.
 *
 * Shows trophy icon + "Circuit complété!" message.
 * Auto-dismisses after 3s or on tap.
 */
export function CircuitCompletionCelebration() {
  const circuitName = useCelebrationStore((s) => s.circuitName)
  const dismiss = useCelebrationStore((s) => s.dismiss)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!circuitName) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    const timer = setTimeout(() => {
      dismiss()
    }, 3000)

    return () => clearTimeout(timer)
  }, [circuitName, dismiss])

  if (!isVisible || !circuitName) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <div className="animate-bounce-in flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-foreground">
            Circuit complété !
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{circuitName}</p>
        </div>
      </div>
    </div>
  )
}
