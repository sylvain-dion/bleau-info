/**
 * Hard reset: delete all local caches and force a full resync.
 *
 * Clears IndexedDB databases, Zustand persisted stores from
 * localStorage, Cache API entries, and triggers a SW update.
 * Auth state and theme preference are preserved.
 */

import Dexie from 'dexie'

/** localStorage keys used by Zustand persist middleware */
const ZUSTAND_KEYS = [
  'bleau-offline-sectors',
  'bleau-boulder-drafts',
  'bleau-boulder-suggestions',
  'bleau-ticks',
  'bleau-video-submissions',
  'bleau-annotations',
  'bleau-lists',
  'bleau-conflicts',
  'bleau-audit-log',
] as const

/** IndexedDB database names managed by the app */
const INDEXEDDB_NAMES = ['bleau-offline', 'bleau-drafts'] as const

/** Flag set before reload, read by use-post-reset-toast hook */
export const HARD_RESET_FLAG = 'bleau-hard-reset-pending'

export interface HardResetResult {
  success: boolean
  error?: string
}

/**
 * Delete all local data except auth and theme.
 *
 * 1. Delete IndexedDB databases (Dexie)
 * 2. Clear Zustand localStorage keys
 * 3. Clear all Cache API entries
 * 4. Trigger Service Worker update
 */
export async function performHardReset(): Promise<HardResetResult> {
  try {
    // 1. IndexedDB — delete entire databases
    await Promise.all(
      INDEXEDDB_NAMES.map((name) => Dexie.delete(name))
    )

    // 2. Zustand persisted stores
    for (const key of ZUSTAND_KEYS) {
      localStorage.removeItem(key)
    }

    // 3. Cache API — remove all runtime caches
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }

    // 4. Service Worker — trigger update check
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
      }
    }

    // Set flag for post-reload toast
    localStorage.setItem(HARD_RESET_FLAG, '1')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}
