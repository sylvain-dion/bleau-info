'use client'

import { useCallback, useState } from 'react'
import {
  findDuplicates,
  NEARBY_RADIUS_METERS,
  type DuplicateCandidate,
} from '@/lib/detection/duplicate-detector'

export interface DuplicateDetectionState {
  /** Nearby boulders found */
  candidates: DuplicateCandidate[]
  /** Whether detection has been run */
  hasChecked: boolean
  /** Whether user dismissed the warning */
  dismissed: boolean
  /** Run detection for given coordinates */
  checkDuplicates: (lat: number, lng: number, excludeId?: string) => void
  /** User confirmed "it's a different boulder" */
  dismiss: () => void
  /** Reset state */
  reset: () => void
}

/**
 * Hook for duplicate detection in the boulder creation form.
 *
 * Call `checkDuplicates()` when coordinates are set or changed.
 * Returns nearby candidates for display in the warning UI.
 */
export function useDuplicateDetection(): DuplicateDetectionState {
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([])
  const [hasChecked, setHasChecked] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const checkDuplicates = useCallback(
    (lat: number, lng: number, excludeId?: string) => {
      const found = findDuplicates(lat, lng, NEARBY_RADIUS_METERS, excludeId)
      setCandidates(found)
      setHasChecked(true)
      setDismissed(false)
    },
    []
  )

  const dismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  const reset = useCallback(() => {
    setCandidates([])
    setHasChecked(false)
    setDismissed(false)
  }, [])

  return { candidates, hasChecked, dismissed, checkDuplicates, dismiss, reset }
}
