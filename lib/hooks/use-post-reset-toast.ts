'use client'

import { useEffect } from 'react'
import { HARD_RESET_FLAG } from '@/lib/offline/hard-reset'
import { showHardResetToast } from '@/lib/feedback'

/**
 * Show a success toast after a hard reset + page reload.
 *
 * The hard-reset utility sets a localStorage flag before reload.
 * This hook checks for the flag on mount, removes it, and shows
 * the toast. Mount once in the app layout or profile page.
 */
export function usePostResetToast(): void {
  useEffect(() => {
    const flag = localStorage.getItem(HARD_RESET_FLAG)
    if (flag) {
      localStorage.removeItem(HARD_RESET_FLAG)
      showHardResetToast()
    }
  }, [])
}
