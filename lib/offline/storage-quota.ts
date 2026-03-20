/**
 * Browser storage estimation utilities.
 *
 * Wraps `navigator.storage.estimate()` with graceful fallbacks
 * for environments that don't support the Storage API.
 */

export interface StorageEstimate {
  /** Total storage quota in bytes (0 if unknown) */
  quota: number
  /** Currently used storage in bytes (0 if unknown) */
  usage: number
  /** Available space in bytes (0 if unknown) */
  available: number
}

/** Get browser storage estimates with fallback for unsupported envs */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      const quota = estimate.quota ?? 0
      const usage = estimate.usage ?? 0

      return { quota, usage, available: Math.max(0, quota - usage) }
    }
  } catch {
    // Storage API unavailable — return zeros
  }

  return { quota: 0, usage: 0, available: 0 }
}

/** Format bytes to human-readable string (Ko, Mo, Go) */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`
}
