import type { FeatureCollection, Point } from 'geojson'

/** Boulder climbing styles */
export type BoulderStyle = 'dalle' | 'devers' | 'toit' | 'arete' | 'traverse' | 'bloc'

/** Circuit colors (UX-15: double coding color + shape) */
export type CircuitColor = 'jaune' | 'bleu' | 'rouge' | 'blanc' | 'orange' | 'noir'

/** Sun exposure / drying conditions (FR-11) */
export type BoulderExposure = 'ombre' | 'soleil' | 'mi-ombre'

/** Properties for a boulder feature */
export interface BoulderProperties {
  id: string
  name: string
  /** French climbing grade (e.g. "4a", "6b+") */
  grade: string
  sector: string
  circuit: CircuitColor | null
  /** Circuit number within the circuit */
  circuitNumber: number | null
  style: BoulderStyle
  /** Sun exposure for drying conditions */
  exposure: BoulderExposure
  /** Whether the boulder is accessible with a stroller */
  strollerAccessible: boolean
}

/**
 * Mock GeoJSON data for Fontainebleau boulders.
 *
 * Realistic coordinates across 6 well-known sectors.
 * Will be replaced by Supabase queries in Epic 3+.
 */
export const mockBoulders: FeatureCollection<Point, BoulderProperties> = {
  type: 'FeatureCollection',
  features: [
    // ── Cul de Chien (iconic sector) ──
    ...createSectorBoulders('Cul de Chien', 2.6345, 48.3815, [
      { name: 'La Marie-Rose', grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'dalle', exposure: 'soleil', strollerAccessible: false },
      { name: 'Le Surplomb de la Marie-Rose', grade: '6b', circuit: 'rouge', circuitNumber: 2, style: 'devers', exposure: 'mi-ombre', strollerAccessible: false },
      { name: "L'Angle Ben's", grade: '6a+', circuit: 'rouge', circuitNumber: 3, style: 'arete', exposure: 'soleil', strollerAccessible: false },
      { name: 'La Dalle à Poly', grade: '4b', circuit: 'bleu', circuitNumber: 5, style: 'dalle', exposure: 'ombre', strollerAccessible: true },
      { name: 'Le Mur des Lamentations', grade: '5c', circuit: 'bleu', circuitNumber: 12, style: 'dalle', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Fissure des Alpinistes', grade: '3b', circuit: 'jaune', circuitNumber: 8, style: 'bloc', exposure: 'mi-ombre', strollerAccessible: true },
      { name: 'Le Pilier', grade: '6c', circuit: 'rouge', circuitNumber: 7, style: 'arete', exposure: 'soleil', strollerAccessible: false },
      { name: 'La Traversée du Cul de Chien', grade: '5a', circuit: 'bleu', circuitNumber: 18, style: 'traverse', exposure: 'ombre', strollerAccessible: true },
    ]),

    // ── Bas Cuvier (classic) ──
    ...createSectorBoulders('Bas Cuvier', 2.6308, 48.4502, [
      { name: "L'Abbatiale", grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'dalle', exposure: 'mi-ombre', strollerAccessible: false },
      { name: "L'Hélicoptère", grade: '6b+', circuit: 'rouge', circuitNumber: 5, style: 'toit', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Joker', grade: '7a', circuit: null, circuitNumber: null, style: 'devers', exposure: 'soleil', strollerAccessible: false },
      { name: 'Big Boss', grade: '7b', circuit: null, circuitNumber: null, style: 'toit', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Prestat', grade: '5c', circuit: 'bleu', circuitNumber: 3, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: 'Le Carnage', grade: '7a+', circuit: null, circuitNumber: null, style: 'devers', exposure: 'mi-ombre', strollerAccessible: false },
      { name: 'Le Toit du Cul de Chien', grade: '6c', circuit: 'rouge', circuitNumber: 12, style: 'toit', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Dalle de la Rivière', grade: '4a', circuit: 'jaune', circuitNumber: 2, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: 'Le Bouchon', grade: '3c', circuit: 'jaune', circuitNumber: 7, style: 'bloc', exposure: 'mi-ombre', strollerAccessible: true },
    ]),

    // ── Apremont (family-friendly) ──
    ...createSectorBoulders('Apremont', 2.6350, 48.4295, [
      { name: 'Le Toit de Sainte-Catherine', grade: '4a', circuit: 'jaune', circuitNumber: 1, style: 'toit', exposure: 'ombre', strollerAccessible: true },
      { name: "L'Angle de Sainte-Catherine", grade: '5b', circuit: 'bleu', circuitNumber: 4, style: 'arete', exposure: 'mi-ombre', strollerAccessible: true },
      { name: 'La Dalle du Cul de Chien', grade: '3a', circuit: 'jaune', circuitNumber: 15, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: "L'Arête du Diplomate", grade: '5c', circuit: 'bleu', circuitNumber: 9, style: 'arete', exposure: 'ombre', strollerAccessible: true },
      { name: 'Le Dièdre des Désespérés', grade: '6a+', circuit: 'rouge', circuitNumber: 2, style: 'devers', exposure: 'soleil', strollerAccessible: false },
      { name: 'La Barre Fixe', grade: '4c', circuit: 'bleu', circuitNumber: 11, style: 'traverse', exposure: 'mi-ombre', strollerAccessible: true },
      { name: 'Le Mur de la Petite Montagne', grade: '3b', circuit: 'jaune', circuitNumber: 20, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: 'La Baleine', grade: '5a', circuit: 'bleu', circuitNumber: 7, style: 'bloc', exposure: 'ombre', strollerAccessible: true },
    ]),

    // ── Franchard Isatis ──
    ...createSectorBoulders('Franchard Isatis', 2.5950, 48.3980, [
      { name: "L'Angle Parfait", grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'arete', exposure: 'mi-ombre', strollerAccessible: false },
      { name: 'La Traversée de Franchard', grade: '5b', circuit: 'bleu', circuitNumber: 6, style: 'traverse', exposure: 'ombre', strollerAccessible: true },
      { name: 'Le Mur Poli', grade: '4a', circuit: 'jaune', circuitNumber: 3, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: 'Le Surplomb Jaune', grade: '3c', circuit: 'jaune', circuitNumber: 12, style: 'devers', exposure: 'ombre', strollerAccessible: true },
      { name: 'Le Toit de Franchard', grade: '6b', circuit: 'rouge', circuitNumber: 5, style: 'toit', exposure: 'soleil', strollerAccessible: false },
      { name: 'La Fissure Isatis', grade: '5a', circuit: 'bleu', circuitNumber: 15, style: 'bloc', exposure: 'mi-ombre', strollerAccessible: true },
      { name: 'Le Bouddha', grade: '7a', circuit: null, circuitNumber: null, style: 'devers', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Dalle à Fernand', grade: '4b', circuit: 'jaune', circuitNumber: 18, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
    ]),

    // ── Roche aux Sabots ──
    ...createSectorBoulders('Roche aux Sabots', 2.6100, 48.3850, [
      { name: 'La Dalle aux Sabots', grade: '5a', circuit: 'bleu', circuitNumber: 1, style: 'dalle', exposure: 'mi-ombre', strollerAccessible: true },
      { name: "L'Oeuf", grade: '4b', circuit: 'jaune', circuitNumber: 5, style: 'bloc', exposure: 'soleil', strollerAccessible: true },
      { name: 'Le Petit Toit', grade: '6a', circuit: 'rouge', circuitNumber: 3, style: 'toit', exposure: 'ombre', strollerAccessible: false },
      { name: 'La Traversée des Sabots', grade: '5c', circuit: 'bleu', circuitNumber: 8, style: 'traverse', exposure: 'soleil', strollerAccessible: false },
      { name: 'Le Mur du Fond', grade: '3a', circuit: 'jaune', circuitNumber: 14, style: 'dalle', exposure: 'mi-ombre', strollerAccessible: true },
      { name: "L'Arête des Sabots", grade: '6b+', circuit: 'rouge', circuitNumber: 7, style: 'arete', exposure: 'soleil', strollerAccessible: false },
      { name: 'Le Surplomb des Sabots', grade: '7a+', circuit: null, circuitNumber: null, style: 'devers', exposure: 'ombre', strollerAccessible: false },
    ]),

    // ── Cuvier Rempart ──
    ...createSectorBoulders('Cuvier Rempart', 2.6380, 48.4480, [
      { name: 'Le Mur des Escaladeurs', grade: '5b', circuit: 'bleu', circuitNumber: 2, style: 'dalle', exposure: 'mi-ombre', strollerAccessible: false },
      { name: 'La Dalle du Rempart', grade: '4a', circuit: 'jaune', circuitNumber: 4, style: 'dalle', exposure: 'soleil', strollerAccessible: true },
      { name: "L'Arête du Rempart", grade: '6a+', circuit: 'rouge', circuitNumber: 1, style: 'arete', exposure: 'ombre', strollerAccessible: false },
      { name: 'Le Toit Classique', grade: '6b', circuit: 'rouge', circuitNumber: 9, style: 'toit', exposure: 'soleil', strollerAccessible: false },
      { name: 'La Traversée du Rempart', grade: '5a', circuit: 'bleu', circuitNumber: 10, style: 'traverse', exposure: 'mi-ombre', strollerAccessible: true },
      { name: 'Le Surplomb du Rempart', grade: '7a', circuit: null, circuitNumber: null, style: 'devers', exposure: 'ombre', strollerAccessible: false },
      { name: "L'Éléphant", grade: '3b', circuit: 'jaune', circuitNumber: 12, style: 'bloc', exposure: 'soleil', strollerAccessible: true },
      { name: 'Le Bec de Perroquet', grade: '5c', circuit: 'bleu', circuitNumber: 15, style: 'arete', exposure: 'mi-ombre', strollerAccessible: false },
    ]),
  ],
}

/** Helper to create boulders with scattered coordinates around a sector center */
function createSectorBoulders(
  sector: string,
  centerLng: number,
  centerLat: number,
  boulders: Omit<BoulderProperties, 'id' | 'sector'>[]
) {
  return boulders.map((boulder, index) => {
    // Scatter boulders within ~200m of sector center using a deterministic pattern
    const angle = (index * 2.399) % (2 * Math.PI) // golden angle for even distribution
    const radius = 0.001 + (index * 0.0003) % 0.002 // ~100-300m radius
    const lng = centerLng + radius * Math.cos(angle)
    const lat = centerLat + radius * Math.sin(angle)

    const id = `${sector.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
      properties: {
        id,
        name: boulder.name,
        grade: boulder.grade,
        sector,
        circuit: boulder.circuit,
        circuitNumber: boulder.circuitNumber,
        style: boulder.style,
        exposure: boulder.exposure,
        strollerAccessible: boulder.strollerAccessible,
      },
    }
  })
}

/** Circuit color hex values for map rendering (UX-03, UX-15) */
export const CIRCUIT_COLORS: Record<CircuitColor, string> = {
  jaune: '#FACC15',
  bleu: '#3B82F6',
  rouge: '#EF4444',
  blanc: '#E4E4E7',
  orange: '#FF6B00',
  noir: '#18181B',
}

/** Circuit shape symbols for colorblind accessibility (UX-15) */
export const CIRCUIT_SHAPES: Record<CircuitColor, string> = {
  jaune: 'triangle',
  bleu: 'circle',
  rouge: 'square',
  blanc: 'diamond',
  orange: 'pentagon',
  noir: 'hexagon',
}
