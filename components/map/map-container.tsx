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
import { buildHeatmapData } from '@/lib/heatmap'
import { getCircuitRoutes } from '@/lib/data/mock-circuits'
import {
  mockEnvironmentalZones,
  ECO_ZONE_COLORS,
} from '@/lib/data/mock-environmental-zones'
import { getActiveZones } from '@/lib/environmental-zones'
import type { FeatureCollection, Point } from 'geojson'
import { useMapStore } from '@/stores/map-store'
import { useFilterStore, matchesFilters } from '@/stores/filter-store'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import type { FilterState } from '@/stores/filter-store'
import { useGeolocation, type GeoPosition } from '@/hooks/use-geolocation'
import { useAutoLocate } from '@/hooks/use-auto-locate'
import { FilterBar } from '@/components/filters/filter-bar'
import { SearchBar } from '@/components/search/search-bar'
import { BoulderCreationDrawer } from '@/components/boulder/boulder-creation-drawer'
import type { SearchResult } from '@/lib/search'
import { MapSheet } from './map-sheet'
import { MapControls } from './map-controls'
import { HeatmapLegend } from './heatmap-legend'
import { SectorContextBar } from './sector-context-bar'
import { GuidedNavBar } from './guided-nav-bar'
import { UserPositionLayer } from './user-position-layer'
import { useGuidedModeStore } from '@/stores/guided-mode-store'
import { DownloadProgress } from '@/components/offline/download-progress'

interface MapContainerProps {
  /** Current resolved theme ('light' or 'dark') */
  theme: 'light' | 'dark'
}

/** Filter the mock boulder GeoJSON based on current filter state */
/** Circuit dot features (generated once, reused on every filter update) */
let _circuitDotFeatures: GeoJSON.Feature<Point>[] | null = null

function getCircuitDotFeatures(): GeoJSON.Feature<Point>[] {
  if (_circuitDotFeatures) return _circuitDotFeatures
  const routeData = getCircuitRoutes()
  const dots: GeoJSON.Feature<Point>[] = []
  for (const route of routeData.features) {
    const coords = route.geometry.coordinates
    const color = route.properties.color
    for (let i = 0; i < coords.length - 1; i++) {
      const [lng1, lat1] = coords[i]
      const [lng2, lat2] = coords[i + 1]
      const dLng = lng2 - lng1
      const dLat = lat2 - lat1
      const dist = Math.sqrt(dLng * dLng + dLat * dLat)
      const steps = Math.max(2, Math.ceil(dist / 0.0003))
      for (let s = 1; s < steps; s++) {
        const t = s / steps
        dots.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lng1 + dLng * t, lat1 + dLat * t] },
          properties: { _isCircuitDot: true, _circuitColor: color },
        })
      }
    }
  }
  _circuitDotFeatures = dots
  console.log('[Circuits] Generated', dots.length, 'path dots')
  return dots
}

function filterBoulders(state: FilterState): FeatureCollection<Point> {
  const filtered = mockBoulders.features.filter(
    (feature: (typeof mockBoulders.features)[number]) =>
      matchesFilters(feature.properties, state)
  )
  // Always include circuit dots (they're filtered by their own layer filter)
  const circuitDots = getCircuitDotFeatures()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { type: 'FeatureCollection', features: [...filtered, ...circuitDots] } as FeatureCollection<Point, any>
}

export function MapContainer({ theme }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const protocolRef = useRef<Protocol | null>(null)
  const [showBoulderForm, setShowBoulderForm] = useState(false)

  const { center, zoom, setView, hasLocated, setHasLocated, showHeatmap, toggleHeatmap } = useMapStore()
  const isAuthenticated = useAuthStore((s) => !!s.user)

  // Safe geolocation — NFR-04: no GPS in background
  const { locate } = useGeolocation(
    useCallback(
      (pos: GeoPosition) => {
        setHasLocated()
        mapRef.current?.flyTo({
          center: [pos.longitude, pos.latitude],
          zoom: 15,
          duration: MAP_INTERACTION.flyToDuration,
        })
      },
      [setHasLocated]
    ),
    useCallback(() => {
      mapRef.current?.flyTo({
        center: MAP_CENTER,
        zoom: MAP_DEFAULT_ZOOM,
        duration: MAP_INTERACTION.flyToDuration,
      })
    }, [])
  )

  // Auto-locate when returning to the app (only if user previously located)
  useAutoLocate(mapRef, hasLocated)

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

    // Update circuit route visibility based on filter
    updateCircuitVisibility(map, state.circuits)
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
      addEcoZoneLayers(map)
      addBoulderLayers(map)
      addHeatmapLayer(map)
      addCompletedBoulderLayer(map)
      addCircuitLayers(map) // Add circuits during load, same as boulders
      addMapInteractions(map)
      // Apply any pre-existing filters
      updateMapData(useFilterStore.getState())

      // Debug: verify circuit dots are in the source
      map.once('idle', () => {
        const rendered = map.queryRenderedFeatures(undefined, { layers: ['circuit-path-dots'] })
        console.log('[Circuits] Rendered circuit dots in viewport:', rendered.length)
      })
    })

    // Fallback to OSM raster tiles if remote style fails
    map.on('error', (e) => {
      if (e.error?.message?.includes('Failed to fetch') || e.error?.status === 404) {
        map.setStyle(createFallbackStyle())
        map.once('styledata', () => {
          addEcoZoneLayers(map)
          addBoulderLayers(map)
          addHeatmapLayer(map)
          addCompletedBoulderLayer(map)
          addCircuitLayers(map)
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

  /** Subscribe to tick store changes and update completed boulders + heatmap layers */
  useEffect(() => {
    const unsubscribe = useTickStore.subscribe(() => {
      updateCompletedLayer(mapRef.current)
      updateHeatmapData(mapRef.current)
    })
    return unsubscribe
  }, [])

  /** Subscribe to heatmap toggle and update layer visibility */
  useEffect(() => {
    const unsubscribe = useMapStore.subscribe((state, prev) => {
      if (state.showHeatmap === prev.showHeatmap) return
      const map = mapRef.current
      if (!map || !map.getLayer('heatmap')) return
      map.setLayoutProperty(
        'heatmap',
        'visibility',
        state.showHeatmap ? 'visible' : 'none'
      )
    })
    return unsubscribe
  }, [])

  /** Update map style when theme changes */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    map.setStyle(getMapStyleUrl(theme))

    // Re-add layers after style change (setStyle removes all custom layers)
    map.once('styledata', () => {
      addEcoZoneLayers(map)
      addBoulderLayers(map)
      addHeatmapLayer(map)
      addCompletedBoulderLayer(map)
      addCircuitLayers(map)
      addMapInteractions(map)
      updateMapData(useFilterStore.getState())
      // Restore heatmap visibility after style change
      if (useMapStore.getState().showHeatmap) {
        map.setLayoutProperty('heatmap', 'visibility', 'visible')
      }
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

  /** Handle search result selection — FlyTo for boulders, fitBounds for sectors */
  const handleSearchSelect = useCallback((result: SearchResult) => {
    const map = mapRef.current
    if (!map) return

    if (result.type === 'sector' && result.bounds) {
      map.fitBounds(result.bounds, {
        padding: 60,
        duration: MAP_INTERACTION.flyToDuration,
        maxZoom: 16,
      })
    } else {
      map.flyTo({
        center: result.center,
        zoom: result.zoom,
        duration: MAP_INTERACTION.flyToDuration,
      })
    }

    // If it's a boulder, select it to open the MapSheet
    if (result.type === 'boulder' && result.properties) {
      // Delay selection until fly animation is underway so sheet doesn't block view
      setTimeout(() => {
        useMapStore.getState().selectFeature(result.properties!.id)
      }, MAP_INTERACTION.flyToDuration * 0.4)
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {/* Top overlay: filter bar attached to header, then search bar floating */}
      <div className="absolute left-0 right-0 top-0 z-10">
        <FilterBar visibleCount={visibleCount} totalCount={totalCount} />
        <div className="p-3">
          <SearchBar onSelect={handleSearchSelect} />
        </div>
      </div>
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={locate}
        onAdd={isAuthenticated ? () => setShowBoulderForm(true) : undefined}
        onToggleHeatmap={toggleHeatmap}
        heatmapActive={showHeatmap}
      />
      <HeatmapLegend />
      <SectorContextBarWrapper mapRef={mapRef} />
      <GuidedNavBar mapRef={mapRef} />
      <UserPositionLayer mapRef={mapRef} />
      <MapSheet />
      <DownloadProgress />
      <BoulderCreationDrawer
        open={showBoulderForm}
        onOpenChange={setShowBoulderForm}
      />
    </div>
  )
}

/** Wrapper: hides SectorContextBar when guided mode is active */
function SectorContextBarWrapper({ mapRef }: { mapRef: React.RefObject<maplibregl.Map | null> }) {
  const isGuided = useGuidedModeStore((s) => s.isActive)
  if (isGuided) return null
  return <SectorContextBar mapRef={mapRef} />
}

/** Add boulder GeoJSON source with clustering + marker/cluster layers */
function addBoulderLayers(map: maplibregl.Map) {
  // Skip if source already exists (e.g. after theme change re-add)
  if (map.getSource('boulders')) return

  // Initial data includes boulders + circuit path dots
  map.addSource('boulders', {
    type: 'geojson',
    data: filterBoulders(useFilterStore.getState()),
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

  // ── Circuit path dots (small, between boulders) ──
  map.addLayer({
    id: 'circuit-path-dots',
    type: 'circle',
    source: 'boulders',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', '_isCircuitDot'], true]],
    paint: {
      'circle-color': [
        'match',
        ['get', '_circuitColor'],
        'jaune', CIRCUIT_COLORS.jaune,
        'bleu', CIRCUIT_COLORS.bleu,
        'rouge', CIRCUIT_COLORS.rouge,
        'blanc', '#d4d4d8',
        'orange', CIRCUIT_COLORS.orange,
        'noir', CIRCUIT_COLORS.noir,
        '#a1a1aa',
      ],
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        12, 1.5,
        15, 3,
        18, 4,
      ],
      'circle-opacity': 0.6,
    },
  })

  // ── Individual boulder markers (exclude circuit dots) ──
  map.addLayer({
    id: 'boulder-markers',
    type: 'circle',
    source: 'boulders',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', '_isCircuitDot'], true]],
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

/** Add heatmap layer for activity frequency visualization */
function addHeatmapLayer(map: maplibregl.Map) {
  if (map.getSource('heatmap-data')) return

  const data = buildHeatmapData(
    mockBoulders.features,
    useTickStore.getState().ticks
  )

  map.addSource('heatmap-data', {
    type: 'geojson',
    data,
  })

  map.addLayer(
    {
      id: 'heatmap',
      type: 'heatmap',
      source: 'heatmap-data',
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', '_activity'],
          0, 0,
          10, 1,
        ],
        'heatmap-intensity': [
          'interpolate', ['linear'], ['zoom'],
          8, 0.6,
          13, 1.2,
        ],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,255,0)',
          0.2, '#3b82f6',
          0.4, '#22c55e',
          0.6, '#eab308',
          0.8, '#f97316',
          1, '#ef4444',
        ],
        'heatmap-radius': [
          'interpolate', ['linear'], ['zoom'],
          8, 25,
          13, 40,
          16, 60,
        ],
        'heatmap-opacity': [
          'interpolate', ['linear'], ['zoom'],
          13, 0.8,
          15, 0,
        ],
      },
    },
    'clusters' // Insert before clusters so heatmap sits underneath
  )
}

/** Refresh heatmap source data (e.g. after new tick logged) */
function updateHeatmapData(map: maplibregl.Map | null) {
  if (!map) return
  const source = map.getSource('heatmap-data') as maplibregl.GeoJSONSource | undefined
  if (!source) return

  const data = buildHeatmapData(
    mockBoulders.features,
    useTickStore.getState().ticks
  )
  source.setData(data)
}

/** Add a green ring overlay on boulders the user has ticked */
function addCompletedBoulderLayer(map: maplibregl.Map) {
  if (map.getSource('completed-boulders')) return

  // Start with empty feature collection — populated by updateCompletedLayer
  map.addSource('completed-boulders', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  map.addLayer({
    id: 'completed-badge',
    type: 'circle',
    source: 'completed-boulders',
    paint: {
      'circle-color': '#22c55e', // green-500
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        12, 6,
        15, 9,
        18, 13,
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.85,
    },
  })

  // ✓ label on top of the green circle
  map.addLayer({
    id: 'completed-check',
    type: 'symbol',
    source: 'completed-boulders',
    layout: {
      'text-field': '✓',
      'text-font': ['Noto Sans Bold'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        12, 8,
        15, 11,
        18, 14,
      ],
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  // Populate with current data
  updateCompletedLayer(map)
}

/** Update the completed boulders GeoJSON source from tick store */
function updateCompletedLayer(map: maplibregl.Map | null) {
  if (!map) return
  const source = map.getSource('completed-boulders') as maplibregl.GeoJSONSource | undefined
  if (!source) return

  const completedIds = useTickStore.getState().getCompletedBoulderIds()
  const features = mockBoulders.features.filter(
    (f: (typeof mockBoulders.features)[number]) => completedIds.has(f.properties.id)
  )
  source.setData({ type: 'FeatureCollection', features })
}

/**
 * Story 14e.1 — Render currently active environmental zones as
 * translucent polygons under the boulder/cluster layers.
 *
 * Severity drives both fill and outline color so the visual hierarchy
 * matches the banner / dialog UX: forbidden = red, warning = amber,
 * info = sky blue.
 */
function addEcoZoneLayers(map: maplibregl.Map) {
  if (map.getSource('eco-zones')) return

  const active = getActiveZones()
  const data: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: active.map((feature) => ({ ...feature })),
  }

  map.addSource('eco-zones', {
    type: 'geojson',
    data: data as typeof mockEnvironmentalZones,
  })

  // Fill layer — soft translucent.
  map.addLayer({
    id: 'eco-zones-fill',
    type: 'fill',
    source: 'eco-zones',
    paint: {
      'fill-color': [
        'match',
        ['get', 'severity'],
        'forbidden', ECO_ZONE_COLORS.forbidden.fill,
        'warning', ECO_ZONE_COLORS.warning.fill,
        'info', ECO_ZONE_COLORS.info.fill,
        '#94a3b8',
      ],
      'fill-opacity': 0.18,
    },
  })

  // Outline — solid for forbidden zones (full attention).
  map.addLayer({
    id: 'eco-zones-outline-forbidden',
    type: 'line',
    source: 'eco-zones',
    filter: ['==', ['get', 'severity'], 'forbidden'],
    paint: {
      'line-color': ECO_ZONE_COLORS.forbidden.border,
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        10, 1.5,
        15, 2.5,
      ],
      'line-opacity': 0.9,
    },
  })

  // Outline — dashed for warning + info (softer cue).
  map.addLayer({
    id: 'eco-zones-outline-soft',
    type: 'line',
    source: 'eco-zones',
    filter: ['!=', ['get', 'severity'], 'forbidden'],
    paint: {
      'line-color': [
        'match',
        ['get', 'severity'],
        'warning', ECO_ZONE_COLORS.warning.border,
        'info', ECO_ZONE_COLORS.info.border,
        '#64748b',
      ],
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        10, 1,
        15, 2,
      ],
      'line-dasharray': [3, 2],
      'line-opacity': 0.8,
    },
  })
}

/** No-op — circuit dots are injected into the boulders source via filterBoulders() */
function addCircuitLayers(_map: maplibregl.Map) {
  // Circuit path dots are rendered by the 'circuit-path-dots' layer in addBoulderLayers()
}

/**
 * Show/hide circuit lines based on selected circuit filter.
 *
 * - No filter (empty array) → show all circuits
 * - Filter active → only show matching circuits, hide others
 */
function updateCircuitVisibility(
  map: maplibregl.Map,
  selectedCircuits: string[]
): void {
  if (!map.getLayer('circuit-path-dots')) return

  if (selectedCircuits.length === 0) {
    // Show all circuit dots
    map.setFilter('circuit-path-dots', [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', '_isCircuitDot'], true],
    ])
  } else {
    // Show only selected circuits
    map.setFilter('circuit-path-dots', [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', '_isCircuitDot'], true],
      ['in', ['get', '_circuitColor'], ['literal', selectedCircuits]],
    ])
  }
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

  // Click on individual boulder marker → open MapSheet
  map.on('click', 'boulder-markers', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['boulder-markers'] })
    if (!features.length) return

    const props = features[0].properties
    useMapStore.getState().selectFeature(props.id)
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
