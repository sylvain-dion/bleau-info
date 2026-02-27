import { describe, it, expect, beforeEach } from 'vitest'
import { useMapStore } from '@/stores/map-store'
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/maplibre/config'

describe('Map store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useMapStore.setState({
      center: MAP_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      selectedFeatureId: null,
    })
  })

  it('should initialize with Fontainebleau center and default zoom', () => {
    const state = useMapStore.getState()
    expect(state.center).toEqual(MAP_CENTER)
    expect(state.zoom).toBe(MAP_DEFAULT_ZOOM)
    expect(state.selectedFeatureId).toBeNull()
  })

  it('should update center', () => {
    useMapStore.getState().setCenter([2.65, 48.42])
    expect(useMapStore.getState().center).toEqual([2.65, 48.42])
  })

  it('should update zoom', () => {
    useMapStore.getState().setZoom(15)
    expect(useMapStore.getState().zoom).toBe(15)
  })

  it('should update center and zoom together', () => {
    useMapStore.getState().setView([2.7, 48.45], 16)
    const state = useMapStore.getState()
    expect(state.center).toEqual([2.7, 48.45])
    expect(state.zoom).toBe(16)
  })

  it('should select and deselect features', () => {
    useMapStore.getState().selectFeature('boulder-1')
    expect(useMapStore.getState().selectedFeatureId).toBe('boulder-1')

    useMapStore.getState().selectFeature(null)
    expect(useMapStore.getState().selectedFeatureId).toBeNull()
  })
})
