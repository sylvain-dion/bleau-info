import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { offlineDb } from '@/lib/db/offline-db'
import { startSectorDownload } from '@/lib/offline/download-orchestrator'
import { useCustomRouteStore } from '@/stores/custom-route-store'

// Weather fetches hit the network and should be short-circuited in tests.
vi.mock('@/lib/weather/weather-service', () => ({
  fetchWeatherForecast: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/weather/drying-service', () => ({
  fetchRainHistory: vi.fn().mockResolvedValue(null),
}))

/**
 * Story 9.7 — Circuits and custom routes in the offline sector pack.
 *
 * Verifies that a sector download bundles:
 *   - CircuitInfo[] for the sector
 *   - CustomRoute[] that touch the sector
 * into the IndexedDB record, so both are available offline.
 */
describe('download-orchestrator — circuits & routes (Story 9.7)', () => {
  beforeEach(async () => {
    await offlineDb.sectors.clear()
    useCustomRouteStore.setState({ routes: [] })
  })

  it('stores circuits for the downloaded sector', async () => {
    const controller = startSectorDownload('Cul de Chien', () => {})
    await controller.promise

    const cached = await offlineDb.sectors.get('Cul de Chien')
    expect(cached).toBeDefined()
    expect(cached?.circuits).toBeDefined()
    expect(cached!.circuits!.length).toBeGreaterThan(0)
    // All cached circuits must belong to the downloaded sector
    for (const circuit of cached!.circuits!) {
      expect(circuit.sector).toBe('Cul de Chien')
    }
  })

  it('includes custom routes whose boulders are in the sector', async () => {
    useCustomRouteStore.setState({
      routes: [
        {
          id: 'r-in',
          name: 'Route du secteur',
          boulderIds: ['cul-de-chien-1', 'cul-de-chien-2'],
          isPublic: false,
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
        },
        {
          id: 'r-out',
          name: 'Route autre secteur',
          boulderIds: ['bas-cuvier-1', 'bas-cuvier-2'],
          isPublic: false,
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
        },
      ],
    })

    const controller = startSectorDownload('Cul de Chien', () => {})
    await controller.promise

    const cached = await offlineDb.sectors.get('Cul de Chien')
    const ids = cached?.customRoutes?.map((r) => r.id) ?? []
    expect(ids).toContain('r-in')
    expect(ids).not.toContain('r-out')
  })

  it('stores an empty route list when no routes touch the sector', async () => {
    const controller = startSectorDownload('Cul de Chien', () => {})
    await controller.promise

    const cached = await offlineDb.sectors.get('Cul de Chien')
    expect(cached?.customRoutes).toEqual([])
  })
})
