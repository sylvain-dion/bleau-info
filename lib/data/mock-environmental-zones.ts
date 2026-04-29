import type { FeatureCollection, Polygon } from 'geojson'

/**
 * Type of environmental restriction (Story 14e.1).
 *
 * - `nidification`  — bird nesting season (climbing forbidden)
 * - `erosion`       — soil/path erosion concerns (warning)
 * - `humidity`      — wet rock fragility post-rain (warning)
 * - `protection`    — generic protected zone (information)
 */
export type EnvironmentalZoneType =
  | 'nidification'
  | 'erosion'
  | 'humidity'
  | 'protection'

/** Severity drives the UI tone and whether a tick gate is enforced. */
export type EnvironmentalZoneSeverity = 'info' | 'warning' | 'forbidden'

/** Properties for an environmental zone polygon. */
export interface EnvironmentalZoneProperties {
  id: string
  type: EnvironmentalZoneType
  severity: EnvironmentalZoneSeverity
  title: string
  description: string
  /** ISO date — zone active from (inclusive). null = always */
  validFrom: string | null
  /** ISO date — zone active until (inclusive). null = always */
  validTo: string | null
  /** Optional source/credit (ONF, partner). */
  source?: string
}

export type EnvironmentalZoneFeature = GeoJSON.Feature<
  Polygon,
  EnvironmentalZoneProperties
>

/**
 * Mock environmental zones for Fontainebleau.
 *
 * Polygons are intentionally generous so the dev demo lights up. They
 * overlap real mock-boulders sectors to exercise the full pipeline:
 *
 *  1. `nidification` (forbidden) covers the northern Cul de Chien area
 *     — boulders inside it require a confirmation before logging a tick.
 *  2. `erosion` (warning) covers the Apremont approach trail — banner
 *     only, no tick gate.
 *  3. `humidity` (info) covers the southern Bas Cuvier — banner only,
 *     no tick gate, year-round.
 */
export const mockEnvironmentalZones: FeatureCollection<
  Polygon,
  EnvironmentalZoneProperties
> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.6300, 48.3795],
            [2.6390, 48.3795],
            [2.6390, 48.3835],
            [2.6300, 48.3835],
            [2.6300, 48.3795],
          ],
        ],
      },
      properties: {
        id: 'zone-nidification-cul-de-chien',
        type: 'nidification',
        severity: 'forbidden',
        title: 'Nidification du Faucon Pèlerin',
        description:
          'Zone de nidification protégée : escalade interdite du 1er mars au 30 juin pour préserver la couvée.',
        validFrom: '2026-03-01',
        validTo: '2026-06-30',
        source: 'ONF / LPO',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.6315, 48.4275],
            [2.6395, 48.4275],
            [2.6395, 48.4320],
            [2.6315, 48.4320],
            [2.6315, 48.4275],
          ],
        ],
      },
      properties: {
        id: 'zone-erosion-apremont',
        type: 'erosion',
        severity: 'warning',
        title: 'Érosion du sentier nord',
        description:
          'Sentier en cours de restauration. Restez sur les balises et évitez de piétiner la mousse autour des blocs.',
        validFrom: '2026-04-01',
        validTo: '2026-10-31',
        source: 'ONF',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.6275, 48.4485],
            [2.6345, 48.4485],
            [2.6345, 48.4520],
            [2.6275, 48.4520],
            [2.6275, 48.4485],
          ],
        ],
      },
      properties: {
        id: 'zone-humidity-bas-cuvier',
        type: 'humidity',
        severity: 'info',
        title: 'Grès fragile après la pluie',
        description:
          'Le grès est particulièrement friable après les pluies. Patientez 48 h après une averse avant de grimper.',
        validFrom: null,
        validTo: null,
        source: 'COSIROC',
      },
    },
  ],
}

/** Convenience: list-only export for tests + iteration. */
export const mockEnvironmentalZoneList: ReadonlyArray<EnvironmentalZoneFeature> =
  mockEnvironmentalZones.features

/**
 * Color tokens (light + dark) for each severity. Matches the
 * `--eco-warning` family introduced in `app/globals.css`.
 */
export const ECO_ZONE_COLORS: Record<
  EnvironmentalZoneSeverity,
  { fill: string; border: string }
> = {
  info: { fill: '#0ea5e9', border: '#0284c7' },
  warning: { fill: '#a855f7', border: '#7e22ce' },
  forbidden: { fill: '#dc2626', border: '#991b1b' },
}
