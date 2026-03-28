/**
 * Privacy settings store.
 *
 * Controls what's visible on the user's public profile.
 * Defaults: profile public, stats visible, ascensions hidden.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PrivacySettings {
  /** Whether the profile is publicly accessible */
  profilePublic: boolean
  /** Whether stats (tick count, max grade, etc.) are visible */
  statsPublic: boolean
  /** Whether recent ascensions list is visible */
  ascensionsPublic: boolean
  /** Whether the full logbook is accessible */
  logbookPublic: boolean
  /** Whether to appear in sector activity feeds (if false, anonymized) */
  showInFeed: boolean
}

interface PrivacyState {
  settings: PrivacySettings
  updateSettings: (partial: Partial<PrivacySettings>) => void
}

const DEFAULT_SETTINGS: PrivacySettings = {
  profilePublic: true,
  statsPublic: true,
  ascensionsPublic: false,
  logbookPublic: false,
  showInFeed: true,
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
    }),
    { name: 'bleau-privacy-settings' }
  )
)
