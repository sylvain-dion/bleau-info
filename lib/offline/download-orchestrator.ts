/**
 * Download orchestrator for offline sector data.
 *
 * Simulates a multi-phase download with artificial delays:
 * 1. Metadata phase — save boulders + topos to IndexedDB
 * 2. Photos phase — simulate fetching photos (batch of 3)
 * 3. Tiles phase — placeholder for future tile caching
 *
 * Supports pause/resume via AbortController pattern.
 */

import { offlineDb } from '@/lib/db/offline-db'
import { getSectorData } from './sector-data-service'
import { computeSectorHash } from './version-hash'

/** Download progress reported to the UI */
export interface DownloadProgress {
  phase: 'metadata' | 'photos' | 'tiles' | 'complete'
  percent: number
  currentItem: number
  totalItems: number
  bytesDownloaded: number
  bytesTotal: number
}

/** Controller returned by startSectorDownload */
export interface DownloadController {
  /** Pause the current download */
  pause: () => void
  /** Resume a paused download */
  resume: () => void
  /** Cancel and clean up partial data */
  cancel: () => void
  /** Promise that resolves when download completes or rejects on cancel */
  promise: Promise<void>
}

/** Delay helper that respects abort signals */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

/**
 * Start downloading a sector for offline use.
 *
 * Phases run sequentially. Photos are batched (3 concurrent).
 * The download can be paused, resumed, or cancelled at any time.
 */
export function startSectorDownload(
  sectorName: string,
  onProgress: (progress: DownloadProgress) => void
): DownloadController {
  const abortController = new AbortController()
  let isPaused = false
  let pauseResolver: (() => void) | null = null
  let lastPhotoIndex = 0

  /** Wait while paused */
  function waitIfPaused(): Promise<void> {
    if (!isPaused) return Promise.resolve()

    return new Promise((resolve) => {
      pauseResolver = resolve
    })
  }

  async function run(): Promise<void> {
    const sectorData = getSectorData(sectorName)
    const totalBytes = sectorData.sizeBytes
    const boulderCount = sectorData.boulders.features.length
    const totalItems = 1 + boulderCount + 1 // metadata + photos + tiles
    let bytesDownloaded = 0

    // ── Phase 1: Metadata ──
    onProgress({
      phase: 'metadata',
      percent: 0,
      currentItem: 0,
      totalItems,
      bytesDownloaded: 0,
      bytesTotal: totalBytes,
    })

    await delay(200, abortController.signal)
    await waitIfPaused()

    // Save sector to IndexedDB
    await offlineDb.sectors.put({
      name: sectorName,
      boulders: sectorData.boulders,
      topos: sectorData.topos,
      bbox: sectorData.bbox,
      versionHash: computeSectorHash(sectorName),
      downloadedAt: new Date().toISOString(),
      sizeBytes: totalBytes,
    })

    bytesDownloaded = Math.floor(totalBytes * 0.3)
    onProgress({
      phase: 'metadata',
      percent: 30,
      currentItem: 1,
      totalItems,
      bytesDownloaded,
      bytesTotal: totalBytes,
    })

    // ── Phase 2: Photos (simulated) ──
    const batchSize = 3

    for (let i = lastPhotoIndex; i < boulderCount; i += batchSize) {
      await waitIfPaused()
      abortController.signal.throwIfAborted()

      const batchEnd = Math.min(i + batchSize, boulderCount)
      await delay(100, abortController.signal)

      lastPhotoIndex = batchEnd
      const photoProgress = batchEnd / boulderCount
      bytesDownloaded = Math.floor(totalBytes * (0.3 + 0.6 * photoProgress))

      onProgress({
        phase: 'photos',
        percent: Math.floor(30 + 60 * photoProgress),
        currentItem: 1 + batchEnd,
        totalItems,
        bytesDownloaded,
        bytesTotal: totalBytes,
      })
    }

    // ── Phase 3: Tiles (placeholder) ──
    await waitIfPaused()
    abortController.signal.throwIfAborted()

    onProgress({
      phase: 'tiles',
      percent: 95,
      currentItem: totalItems - 1,
      totalItems,
      bytesDownloaded: Math.floor(totalBytes * 0.95),
      bytesTotal: totalBytes,
    })

    await delay(150, abortController.signal)

    // ── Complete ──
    onProgress({
      phase: 'complete',
      percent: 100,
      currentItem: totalItems,
      totalItems,
      bytesDownloaded: totalBytes,
      bytesTotal: totalBytes,
    })
  }

  const promise = run()

  return {
    pause() {
      isPaused = true
    },
    resume() {
      isPaused = false
      pauseResolver?.()
      pauseResolver = null
    },
    cancel() {
      abortController.abort()
    },
    promise,
  }
}

/** Remove all offline data for a sector */
export async function removeSectorData(sectorName: string): Promise<void> {
  await offlineDb.transaction(
    'rw',
    [offlineDb.sectors, offlineDb.photos, offlineDb.tiles],
    async () => {
      await offlineDb.sectors.delete(sectorName)
      await offlineDb.photos
        .where('sectorName')
        .equals(sectorName)
        .delete()
      await offlineDb.tiles
        .where('sectorName')
        .equals(sectorName)
        .delete()
    }
  )
}
