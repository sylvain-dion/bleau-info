# Story 2.1: Integration Carte Vectorielle (MapLibre + Protomaps)

## Status: Done

## Summary

Full-screen interactive vector map using MapLibre GL JS with OpenFreeMap basemap tiles. Boulder markers with clustering, dark mode support, and custom map controls.

## What Was Built

### Core Map Infrastructure
- **MapLibre GL JS** integration via `next/dynamic` (SSR disabled — requires WebGL)
- **OpenFreeMap** basemap styles (liberty for light, dark for dark theme) — free, no API key needed
- **PMTiles protocol** registered for future self-hosted tile support
- **Zustand store** (`stores/map-store.ts`) for map state (center, zoom, selectedFeatureId)

### Boulder Display
- **GeoJSON source** with native MapLibre clustering (radius: 50, maxZoom: 14)
- **Three map layers**: cluster circles (orange gradient by count), cluster count labels, individual boulder markers
- **Circuit color coding**: 6 circuit colors (jaune, bleu, rouge, blanc, orange, noir) with hex values
- **Progressive disclosure**: clusters at intermediate zooms, individual markers at zoom 15+

### Interactions
- Click cluster to zoom in (expansion zoom + 0.5)
- Click boulder marker for popup (name, grade, circuit color dot)
- Cursor changes on hover (pointer for interactive layers)
- Map position synced to Zustand store on moveend

### Map Controls
- Custom zoom in/out and locate buttons (48px touch targets)
- Geolocation integration (flyTo user position or fall back to Fontainebleau center)
- Positioned bottom-right with design system styling

### Theme Support
- Map style switches between light/dark OpenFreeMap styles
- Boulder layers re-added after style change
- Fallback to OSM raster tiles if remote style fails

## Files Created
- `lib/maplibre/config.ts` — Map center, zoom bounds, cluster config, interaction settings
- `lib/maplibre/styles.ts` — OpenFreeMap style URLs + OSM raster fallback
- `lib/data/mock-boulders.ts` — ~49 mock boulders across 6 Fontainebleau sectors
- `components/map/map-container.tsx` — Main MapLibre wrapper component
- `components/map/map-controls.tsx` — Zoom/locate controls
- `stores/map-store.ts` — Zustand map state store
- `__tests__/lib/maplibre-config.test.ts` — Config validation tests
- `__tests__/lib/maplibre-styles.test.ts` — Style URL + fallback tests
- `__tests__/lib/mock-boulders.test.ts` — GeoJSON data integrity tests
- `__tests__/stores/map-store.test.ts` — Store state management tests
- `__tests__/components/map-controls.test.tsx` — Controls rendering + interaction tests

## Files Modified
- `app/page.tsx` — Replaced landing page with full-screen map
- `app/globals.css` — Added MapLibre CSS import
- `package.json` — Added maplibre-gl, pmtiles, @types/geojson
- `eslint.config.mjs` — Fixed naming-convention rule (removed typed linting requirement)
- `e2e/homepage.spec.ts` — Updated for map-based homepage
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Epic 2 in-progress, Story 2.1 done

## Technical Decisions
1. **OpenFreeMap over Protomaps API** — Free, no API key, avoids key expiration issues in development
2. **Direct MapLibre API (no react-map-gl)** — Full control for a map-centric app
3. **Native clustering** — Built-in GeoJSON source clustering, no external library
4. **Fallback style** — OSM raster tiles if vector style URL fails to load

## Test Results
- 70 unit tests passing (11 test files)
- Production build succeeds
- Map renders correctly in development (basemap + clusters verified visually)
