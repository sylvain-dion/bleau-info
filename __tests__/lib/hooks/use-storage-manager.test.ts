import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStorageManager } from '@/lib/hooks/use-storage-manager'
import * as storageQuota from '@/lib/offline/storage-quota'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSectors: Record<string, {
  name: string
  status: string
  sizeBytes: number
  downloadedAt: string
  versionHash: string
}> = {}

const mockRemoveSector = vi.fn()

vi.mock('@/stores/offline-sector-store', () => ({
  useOfflineSectorStore: (selector: (s: unknown) => unknown) => {
    const state = {
      sectors: mockSectors,
      removeSector: mockRemoveSector,
    }
    return selector(state)
  },
}))

vi.mock('@/lib/offline/storage-quota', () => ({
  getStorageEstimate: vi.fn().mockResolvedValue({
    quota: 10 * 1024 * 1024 * 1024, // 10 GB
    usage: 512 * 1024 * 1024,        // 512 MB
    available: 9.5 * 1024 * 1024 * 1024,
  }),
  formatBytes: (bytes: number) => `${bytes} B`,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedSector(name: string, sizeBytes: number, daysAgo = 3) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  mockSectors[name] = { name, status: 'downloaded', sizeBytes, downloadedAt: date, versionHash: 'abc' }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStorageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset sectors
    for (const key of Object.keys(mockSectors)) {
      delete mockSectors[key]
    }
    mockRemoveSector.mockResolvedValue(undefined)
  })

  it('returns empty sectors when no packs are downloaded', async () => {
    const { result } = renderHook(() => useStorageManager())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sectors).toHaveLength(0)
    expect(result.current.totalSectorBytes).toBe(0)
  })

  it('returns downloaded sectors sorted by size descending', async () => {
    seedSector('Petit Secteur', 50 * 1024 * 1024)
    seedSector('Gros Secteur', 200 * 1024 * 1024)
    seedSector('Secteur Moyen', 100 * 1024 * 1024)

    const { result } = renderHook(() => useStorageManager())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sectors).toHaveLength(3)
    expect(result.current.sectors[0].name).toBe('Gros Secteur')
    expect(result.current.sectors[1].name).toBe('Secteur Moyen')
    expect(result.current.sectors[2].name).toBe('Petit Secteur')
  })

  it('excludes non-downloaded sectors', async () => {
    seedSector('Downloaded', 100 * 1024 * 1024)
    mockSectors['Downloading'] = {
      name: 'Downloading',
      status: 'downloading',
      sizeBytes: 50 * 1024 * 1024,
      downloadedAt: '',
      versionHash: '',
    }

    const { result } = renderHook(() => useStorageManager())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.sectors).toHaveLength(1)
    expect(result.current.sectors[0].name).toBe('Downloaded')
  })

  it('computes totalSectorBytes as sum of all sector sizes', async () => {
    seedSector('A', 100)
    seedSector('B', 200)
    seedSector('C', 300)

    const { result } = renderHook(() => useStorageManager())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.totalSectorBytes).toBe(600)
  })

  it('fetches storage estimate on mount', async () => {
    const { result } = renderHook(() => useStorageManager())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(storageQuota.getStorageEstimate).toHaveBeenCalledTimes(1)
    expect(result.current.estimate.quota).toBe(10 * 1024 * 1024 * 1024)
    expect(result.current.estimate.usage).toBe(512 * 1024 * 1024)
  })

  it('calls storeRemove and refreshes estimate on removeSector', async () => {
    seedSector('Gorges', 124 * 1024 * 1024)

    const { result } = renderHook(() => useStorageManager())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.removeSector('Gorges')
    })

    expect(mockRemoveSector).toHaveBeenCalledWith('Gorges')
    // estimate refreshed: getStorageEstimate called mount + after remove = 2 times
    expect(storageQuota.getStorageEstimate).toHaveBeenCalledTimes(2)
  })

  it('returns freed bytes from removeSector', async () => {
    seedSector('Rocher Canon', 89 * 1024 * 1024)

    const { result } = renderHook(() => useStorageManager())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let freed = 0
    await act(async () => {
      freed = await result.current.removeSector('Rocher Canon')
    })

    expect(freed).toBe(89 * 1024 * 1024)
  })
})
