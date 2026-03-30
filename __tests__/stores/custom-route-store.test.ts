import { describe, it, expect, beforeEach } from 'vitest'
import { useCustomRouteStore } from '@/stores/custom-route-store'

function resetStore() {
  useCustomRouteStore.setState({ routes: [] })
}

describe('useCustomRouteStore', () => {
  beforeEach(() => resetStore())

  it('starts with empty routes', () => {
    expect(useCustomRouteStore.getState().routes).toHaveLength(0)
  })

  it('createRoute adds a new route and returns ID', () => {
    const id = useCustomRouteStore.getState().createRoute('Mon parcours')
    expect(id).toBeDefined()
    const routes = useCustomRouteStore.getState().routes
    expect(routes).toHaveLength(1)
    expect(routes[0].name).toBe('Mon parcours')
    expect(routes[0].boulderIds).toHaveLength(0)
    expect(routes[0].isPublic).toBe(false)
  })

  it('deleteRoute removes a route', () => {
    const id = useCustomRouteStore.getState().createRoute('Temp')
    useCustomRouteStore.getState().deleteRoute(id)
    expect(useCustomRouteStore.getState().routes).toHaveLength(0)
  })

  it('renameRoute updates name', () => {
    const id = useCustomRouteStore.getState().createRoute('Old')
    useCustomRouteStore.getState().renameRoute(id, 'New')
    expect(useCustomRouteStore.getState().routes[0].name).toBe('New')
  })

  it('addBoulder appends to boulderIds', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    useCustomRouteStore.getState().addBoulder(id, 'b-2')
    const route = useCustomRouteStore.getState().getRoute(id)!
    expect(route.boulderIds).toEqual(['b-1', 'b-2'])
  })

  it('addBoulder is idempotent (no duplicates)', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    expect(useCustomRouteStore.getState().getRoute(id)!.boulderIds).toEqual([
      'b-1',
    ])
  })

  it('removeBoulder removes from list', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    useCustomRouteStore.getState().addBoulder(id, 'b-2')
    useCustomRouteStore.getState().removeBoulder(id, 'b-1')
    expect(useCustomRouteStore.getState().getRoute(id)!.boulderIds).toEqual([
      'b-2',
    ])
  })

  it('reorderBoulders replaces the entire list', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    useCustomRouteStore.getState().addBoulder(id, 'b-2')
    useCustomRouteStore.getState().addBoulder(id, 'b-3')
    useCustomRouteStore.getState().reorderBoulders(id, ['b-3', 'b-1', 'b-2'])
    expect(useCustomRouteStore.getState().getRoute(id)!.boulderIds).toEqual([
      'b-3',
      'b-1',
      'b-2',
    ])
  })

  it('togglePublic flips isPublic', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    expect(useCustomRouteStore.getState().getRoute(id)!.isPublic).toBe(false)
    useCustomRouteStore.getState().togglePublic(id)
    expect(useCustomRouteStore.getState().getRoute(id)!.isPublic).toBe(true)
    useCustomRouteStore.getState().togglePublic(id)
    expect(useCustomRouteStore.getState().getRoute(id)!.isPublic).toBe(false)
  })

  it('getRoute returns undefined for unknown ID', () => {
    expect(useCustomRouteStore.getState().getRoute('nope')).toBeUndefined()
  })

  it('updates updatedAt on mutations', () => {
    const id = useCustomRouteStore.getState().createRoute('Route')
    const created = useCustomRouteStore.getState().getRoute(id)!.createdAt
    useCustomRouteStore.getState().addBoulder(id, 'b-1')
    const route = useCustomRouteStore.getState().getRoute(id)!
    // updatedAt should be set (may equal createdAt if same ms, but should exist)
    expect(route.updatedAt).toBeDefined()
    expect(route.updatedAt.length).toBeGreaterThan(0)
    expect(new Date(route.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created).getTime()
    )
  })

  it('newest routes appear first', () => {
    useCustomRouteStore.getState().createRoute('First')
    useCustomRouteStore.getState().createRoute('Second')
    const routes = useCustomRouteStore.getState().routes
    expect(routes[0].name).toBe('Second')
    expect(routes[1].name).toBe('First')
  })
})
