/**
 * Zustand store for offline sector download management.
 *
 * Persists download status per sector. Orchestrates downloads
 * via the download-orchestrator and wires into the network store
 * for the offline pill badge.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  startSectorDownload,
  removeSectorData,
  type DownloadController,
  type DownloadProgress,
} from '@/lib/offline/download-orchestrator'
import { computeSectorHash } from '@/lib/offline/version-hash'
import { useNetworkStore } from './network-store'

/** Download status for a sector */
export type SectorStatus =
  | 'available'
  | 'downloading'
  | 'paused'
  | 'downloaded'
  | 'update'
  | 'error'

/** Persisted info about a downloaded sector */
export interface DownloadedSectorInfo {
  name: string
  status: SectorStatus
  versionHash: string
  downloadedAt: string
  sizeBytes: number
  errorMessage?: string
}

/** Transient active download state (not persisted) */
export interface ActiveDownload {
  sectorName: string
  progress: DownloadProgress
}

interface OfflineSectorState {
  /** Persisted sector records */
  sectors: Record<string, DownloadedSectorInfo>

  /** Transient: current active download (null when idle) */
  activeDownload: ActiveDownload | null

  /** Start downloading a sector */
  startDownload: (sectorName: string) => void
  /** Pause the active download */
  pauseDownload: () => void
  /** Resume a paused download */
  resumeDownload: () => void
  /** Cancel the active download */
  cancelDownload: () => void
  /** Remove a downloaded sector */
  removeSector: (sectorName: string) => Promise<void>
  /** Check if a sector is available offline */
  isSectorOffline: (sectorName: string) => boolean
  /** Check for available updates */
  checkForUpdates: () => void
}

/** Active controller reference (not stored in Zustand state) */
let activeController: DownloadController | null = null

export const useOfflineSectorStore = create<OfflineSectorState>()(
  persist(
    (set, get) => ({
      sectors: {},
      activeDownload: null,

      startDownload(sectorName: string) {
        const { sectors } = get()

        // Already downloading
        if (activeController) return

        set({
          sectors: {
            ...sectors,
            [sectorName]: {
              name: sectorName,
              status: 'downloading',
              versionHash: '',
              downloadedAt: '',
              sizeBytes: 0,
            },
          },
          activeDownload: {
            sectorName,
            progress: {
              phase: 'metadata',
              percent: 0,
              currentItem: 0,
              totalItems: 0,
              bytesDownloaded: 0,
              bytesTotal: 0,
            },
          },
        })

        const controller = startSectorDownload(sectorName, (progress) => {
          set({ activeDownload: { sectorName, progress } })
        })

        activeController = controller

        controller.promise
          .then(() => {
            const hash = computeSectorHash(sectorName)

            set((state) => ({
              sectors: {
                ...state.sectors,
                [sectorName]: {
                  name: sectorName,
                  status: 'downloaded',
                  versionHash: hash,
                  downloadedAt: new Date().toISOString(),
                  sizeBytes:
                    state.activeDownload?.progress.bytesTotal ?? 0,
                },
              },
              activeDownload: null,
            }))

            activeController = null

            // Wire into offline pill
            useNetworkStore.getState().setDownloadedContent(true)
          })
          .catch((err) => {
            activeController = null

            // AbortError = user cancelled → clean up silently
            if (err instanceof DOMException && err.name === 'AbortError') {
              removeSectorData(sectorName).catch(() => {})

              set((state) => {
                const { [sectorName]: _, ...rest } = state.sectors
                return { sectors: rest, activeDownload: null }
              })
              return
            }

            // Real error
            set((state) => ({
              sectors: {
                ...state.sectors,
                [sectorName]: {
                  ...state.sectors[sectorName],
                  status: 'error',
                  errorMessage:
                    err instanceof Error ? err.message : 'Erreur inconnue',
                },
              },
              activeDownload: null,
            }))
          })
      },

      pauseDownload() {
        if (!activeController) return

        activeController.pause()
        const { activeDownload, sectors } = get()
        if (!activeDownload) return

        set({
          sectors: {
            ...sectors,
            [activeDownload.sectorName]: {
              ...sectors[activeDownload.sectorName],
              status: 'paused',
            },
          },
        })
      },

      resumeDownload() {
        if (!activeController) return

        activeController.resume()
        const { activeDownload, sectors } = get()
        if (!activeDownload) return

        set({
          sectors: {
            ...sectors,
            [activeDownload.sectorName]: {
              ...sectors[activeDownload.sectorName],
              status: 'downloading',
            },
          },
        })
      },

      cancelDownload() {
        if (!activeController) return
        activeController.cancel()
      },

      async removeSector(sectorName: string) {
        await removeSectorData(sectorName)

        set((state) => {
          const { [sectorName]: _, ...rest } = state.sectors

          // Update network store if no sectors remain
          const hasAny = Object.values(rest).some(
            (s) => s.status === 'downloaded'
          )
          if (!hasAny) {
            useNetworkStore.getState().setDownloadedContent(false)
          }

          return { sectors: rest }
        })
      },

      isSectorOffline(sectorName: string): boolean {
        return get().sectors[sectorName]?.status === 'downloaded'
      },

      checkForUpdates() {
        const { sectors } = get()
        const updated: Record<string, DownloadedSectorInfo> = { ...sectors }
        let hasChanges = false

        for (const [name, info] of Object.entries(sectors)) {
          if (info.status !== 'downloaded') continue

          const currentHash = computeSectorHash(name)
          if (currentHash !== info.versionHash) {
            updated[name] = { ...info, status: 'update' }
            hasChanges = true
          }
        }

        if (hasChanges) {
          set({ sectors: updated })
        }
      },
    }),
    {
      name: 'bleau-offline-sectors',
      partialize: (state) => ({
        sectors: state.sectors,
      }),
    }
  )
)
