'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  CLUSTER_CONFIG,
  MAP_INTERACTION,
} from '@/lib/maplibre/config'
import { getMapStyleUrl, createFallbackStyle } from '@/lib/maplibre/styles'
import { mockBoulders, CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type { CircuitColor } from '@/lib/data/mock-boulders'
import { useMapStore } from '@/stores/map-store'
import { useFilterStore, matchesFilters } from '@/stores/filter-store'
import type { FilterState } from '@/stores/filter-store'
import { FilterBar } from '@/components/filters/filter-bar'
import { MapControls } from './map-controls'

interface MapContainerProps {
  /** Current resolved theme ('light' or 'dark') */
  theme: 'light' | 'dark'
}

/** Filter the mock boulder GeoJSON based on current filter state */
function filterBoulders(state: FilterState): typeof mockBoulders {
  const filtered = mockBoulders.features.filter(
    (feature: (typeof mockBoulders.features)[number]) =>
      matchesFilters(feature.properties, state)
  )
  return { type: 'FeatureCollection', features: filtered }
}

export function MapContainer({ theme }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const protocolRef = useRef<Protocol | null>(null)

  const { center, zoom, setView } = useMapStore()

  // Track visible/total counts for the filter bar
  const totalCount = mockBoulders.features.length
  const [visibleCount, setVisibleCount] = useState(totalCount)

  /** Update the map GeoJSON source with filtered data */
  const updateMapData = useCallback((state: FilterState) => {
    const map = mapRef.current
    if (!map) return

    const source = map.getSource('boulders') as maplibregl.GeoJSONSource | undefined
    if (!source) return

    const filtered = filterBoulders(state)
    source.setData(filtered)
    setVisibleCount(filtered.features.length)
  }, [])

  /** Initialize the map */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Register PMTiles protocol
    const protocol = new Protocol()
    protocolRef.current = protocol
    maplibregl.addProtocol('pmtiles', protocol.tile)

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(theme),
      center,
      zoom,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxPitch: MAP_INTERACTION.maxPitch,
      attributionControl: false,
    })

    // Add compact attribution
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    )

    map.on('load', () => {
      addBoulderLayers(map)
      addMapInteractions(map)
      // Apply any pre-existing filters
      updateMapData(useFilterStore.getState())
    })

    // Fallback to OSM raster tiles if remote style fails
    map.on('error', (e) => {
      if (e.error?.message?.includes('Failed to fetch') || e.error?.status === 404) {
        map.setStyle(createFallbackStyle())
        map.once('styledata', () => {
          addBoulderLayers(map)
          addMapInteractions(map)
          updateMapData(useFilterStore.getState())
        })
      }
    })

    // Sync map position to store
    map.on('moveend', () => {
      const c = map.getCenter()
      setView([c.lng, c.lat], map.getZoom())
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      if (protocolRef.current) {
        maplibregl.removeProtocol('pmtiles')
        protocolRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Subscribe to filter store changes and update map data */
  useEffect(() => {
    const unsubscribe = useFilterStore.subscribe((state) => {
      updateMapData(state)
    })
    return unsubscribe
  }, [updateMapData])

  /** Update map style when theme changes */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    map.setStyle(getMapStyleUrl(theme))

    // Re-add layers after style change (setStyle removes all custom layers)
    map.once('styledata', () => {
      addBoulderLayers(map)
      addMapInteractions(map)
      updateMapData(useFilterStore.getState())
    })
  }, [theme, updateMapData])

  /** Handle zoom in */
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: 300 })
  }, [])

  /** Handle zoom out */
  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: 300 })
  }, [])

  /** Handle locate me */
  const handleLocate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          duration: MAP_INTERACTION.flyToDuration,
        })
      },
      () => {
        // Geolocation denied or unavailable — fly to default center
        mapRef.current?.flyTo({
          center: MAP_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
          duration: MAP_INTERACTION.flyToDuration,
        })
      }
    )
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <FilterBar visibleCount={visibleCount} totalCount={totalCount} />
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
      />
    </div>
  )
}

/** Add boulder GeoJSON source with clustering + marker/cluster layers */
function addBoulderLayers(map: maplibregl.Map) {
  // Skip if source already exists (e.g. after theme change re-add)
  if (map.getSource('boulders')) return

  map.addSource('boulders', {
    type: 'geojson',
    data: mockBoulders,
    ...CLUSTER_CONFIG,
  })

  // ── Cluster circles ──
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'boulders',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#FF8533', // < 10: primary light
        10,
        '#FF6B00', // 10–30: primary
        30,
        '#CC5500', // 30+: primary dark
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        18, // < 10
        10,
        24, // 10–30
        30,
        32, // 30+
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
    },
  })

  // ── Cluster count labels ──
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'boulders',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Noto Sans Bold'],
      'text-size': 13,
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  // ── Individual boulder markers ──
  map.addLayer({
    id: 'boulder-markers',
    type: 'circle',
    source: 'boulders',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'circuit'],
        'jaune', CIRCUIT_COLORS.jaune,
        'bleu', CIRCUIT_COLORS.bleu,
        'rouge', CIRCUIT_COLORS.rouge,
        'blanc', CIRCUIT_COLORS.blanc,
        'orange', CIRCUIT_COLORS.orange,
        'noir', CIRCUIT_COLORS.noir,
        '#a1a1aa', // default: zinc-400 for boulders without a circuit
      ],
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        12, 4,
        15, 7,
        18, 10,
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': [
        'interpolate', ['linear'], ['zoom'],
        12, 1,
        15, 2,
      ],
    },
  })
}

/** Add click interactions for clusters and individual markers */
function addMapInteractions(map: maplibregl.Map) {
  // Click on cluster → zoom in
  map.on('click', 'clusters', async (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    if (!features.length) return

    const clusterId = features[0].properties.cluster_id
    const source = map.getSource('boulders') as maplibregl.GeoJSONSource

    try {
      const zoom = await source.getClusterExpansionZoom(clusterId)
      const geometry = features[0].geometry
      if (geometry.type === 'Point') {
        map.flyTo({
          center: geometry.coordinates as [number, number],
          zoom: zoom + 0.5,
          duration: MAP_INTERACTION.flyToDuration,
        })
      }
    } catch {
      // Cluster expansion failed silently
    }
  })

  // Click on individual boulder marker
  map.on('click', 'boulder-markers', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['boulder-markers'] })
    if (!features.length) return

    const feature = features[0]
    const props = feature.properties
    const name = props.name || 'Bloc inconnu'
    const grade = props.grade || ''
    const circuit = props.circuit as CircuitColor | null
    const circuitColor = circuit ? CIRCUIT_COLORS[circuit] : '#a1a1aa'

    // Select the feature in the store (for future Bottom Sheet integration)
    useMapStore.getState().selectFeature(props.id)

    // Show a popup with boulder info
    const geometry = feature.geometry
    if (geometry.type === 'Point') {
      new maplibregl.Popup({ offset: 12, closeButton: false })
        .setLngLat(geometry.coordinates as [number, number])
        .setHTML(
          `<div style="font-family:var(--font-onest),sans-serif;padding:4px 0">` +
          `<strong style="font-size:14px">${name}</strong>` +
          `<div style="margin-top:4px;display:flex;align-items:center;gap:6px">` +
          `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${circuitColor}"></span>` +
          `<span style="font-size:13px;color:#71717a">${grade}</span>` +
          `</div>` +
          `</div>`
        )
        .addTo(map)
    }
  })

  // Cursor changes on hover
  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = ''
  })
  map.on('mouseenter', 'boulder-markers', () => {
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', 'boulder-markers', () => {
    map.getCanvas().style.cursor = ''
  })
}
