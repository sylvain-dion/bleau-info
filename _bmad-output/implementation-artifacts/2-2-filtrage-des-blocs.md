# Story 2.2: Filtrage des Blocs

## Status: DONE

## Summary

Implemented multi-criteria block filtering on the interactive map. Users can filter boulders by circuit color, climbing grade range, style, sun exposure, and stroller accessibility. Filters update the map in real-time with zero-latency optimistic UI.

## What Was Built

### Data Model Extensions
- Added `exposure` field (`ombre` | `soleil` | `mi-ombre`) to `BoulderProperties`
- Added `strollerAccessible` boolean field to `BoulderProperties`
- Updated all 49 mock boulders with realistic exposure and accessibility data

### Grade Utilities (`lib/grades.ts`)
- Complete French bouldering grade scale (3a through 8c, 26 grades)
- Grade parsing, comparison, and range-checking functions
- Grade formatting utilities for display

### Filter Store (`stores/filter-store.ts`)
- Zustand store managing all filter criteria
- Toggle actions for circuits, styles, and exposures (multi-select)
- Grade range (min/max) with select-based picker
- Stroller-only boolean toggle
- Reset all filters action
- Pure `matchesFilters()` function for testable filter logic
- `countActiveFilters()` helper for badge display

### Filter Bar (`components/filters/filter-bar.tsx`)
- Horizontal scrollable chip bar overlaying the top of the map
- Quick-access circuit color chips with color dots
- Quick stroller toggle chip
- "Filtres" button with active filter count badge
- Result count display (e.g., "23 / 49 blocs") when filters are active
- Reset button to clear all filters

### Filter Drawer (`components/filters/filter-drawer.tsx`)
- Bottom sheet using Vaul (Drawer) library
- Organized sections: Circuit, Niveau (Grade), Style, Exposition, Accessibilité
- Grade range selection with min/max dropdowns
- Full reset button in footer
- Accessible: proper ARIA roles, keyboard navigable

### Map Integration
- Filter store subscription in `MapContainer` updates GeoJSON source data
- `source.setData()` for instant re-render (no flicker)
- Filter state persists across theme changes and map navigation
- Cluster counts update automatically with filtered data

## Technical Decisions

1. **Client-side filtering**: All filtering happens on the GeoJSON data before passing to MapLibre. This provides instant (<16ms) updates and works fully offline.

2. **Zustand subscription pattern**: Used `useFilterStore.subscribe()` to listen for filter changes and update the map source imperatively, avoiding React re-render overhead.

3. **AND logic for combined filters**: Multiple active filter categories are combined with AND (all must match). Within a category (e.g., multiple circuit colors), OR logic applies.

4. **Grade presets**: The grade picker uses 10 common presets rather than all 26 grades to keep the UI clean while covering practical use cases.

## Files Changed

- `lib/data/mock-boulders.ts` — Extended BoulderProperties, added exposure/stroller data
- `lib/grades.ts` — NEW: Grade scale, parsing, comparison utilities
- `stores/filter-store.ts` — NEW: Zustand filter state management
- `components/filters/filter-chip.tsx` — NEW: Reusable filter chip component
- `components/filters/filter-bar.tsx` — NEW: Horizontal filter bar overlay
- `components/filters/filter-drawer.tsx` — NEW: Bottom sheet with all filter options
- `components/map/map-container.tsx` — Integrated FilterBar + filter store subscription
- `app/globals.css` — Added scrollbar-none utility

## Tests Added

- `__tests__/lib/grades.test.ts` — 17 tests covering grade scale, indexing, ranges, formatting
- `__tests__/stores/filter-store.test.ts` — 26 tests covering store actions, active count, matching logic

## Acceptance Criteria Verification

- [x] Filter panel opens from map view
- [x] Circuit and exposure filters work (e.g., "Circuit Orange" + "À l'ombre")
- [x] Map updates instantaneously when filters change
- [x] Result counter shows number of visible blocs
- [x] Active filters indicated visually (badge on filter button)
- [x] Filters persist in Zustand store during navigation
