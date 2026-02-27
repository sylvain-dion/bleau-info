import { create } from 'zustand'
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/maplibre/config'

interface MapState {
  /** Map center [lng, lat] */
  center: [number, number]
  /** Current zoom level */
  zoom: number
  /** ID of the currently selected boulder feature */
  selectedFeatureId: string | null

  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setView: (center: [number, number], zoom: number) => void
  selectFeature: (id: string | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  center: MAP_CENTER,
  zoom: MAP_DEFAULT_ZOOM,
  selectedFeatureId: null,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setView: (center, zoom) => set({ center, zoom }),
  selectFeature: (id) => set({ selectedFeatureId: id }),
}))
