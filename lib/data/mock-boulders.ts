import type { FeatureCollection, Point } from 'geojson'

/** Boulder climbing styles */
export type BoulderStyle = 'dalle' | 'devers' | 'toit' | 'arete' | 'traverse' | 'bloc'

/** Circuit colors (UX-15: double coding color + shape) */
export type CircuitColor = 'jaune' | 'bleu' | 'rouge' | 'blanc' | 'orange' | 'noir'

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
      { name: 'La Marie-Rose', grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'dalle' },
      { name: 'Le Surplomb de la Marie-Rose', grade: '6b', circuit: 'rouge', circuitNumber: 2, style: 'devers' },
      { name: "L'Angle Ben's", grade: '6a+', circuit: 'rouge', circuitNumber: 3, style: 'arete' },
      { name: 'La Dalle à Poly', grade: '4b', circuit: 'bleu', circuitNumber: 5, style: 'dalle' },
      { name: 'Le Mur des Lamentations', grade: '5c', circuit: 'bleu', circuitNumber: 12, style: 'dalle' },
      { name: 'La Fissure des Alpinistes', grade: '3b', circuit: 'jaune', circuitNumber: 8, style: 'bloc' },
      { name: 'Le Pilier', grade: '6c', circuit: 'rouge', circuitNumber: 7, style: 'arete' },
      { name: 'La Traversée du Cul de Chien', grade: '5a', circuit: 'bleu', circuitNumber: 18, style: 'traverse' },
    ]),

    // ── Bas Cuvier (classic) ──
    ...createSectorBoulders('Bas Cuvier', 2.6308, 48.4502, [
      { name: "L'Abbatiale", grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'dalle' },
      { name: "L'Hélicoptère", grade: '6b+', circuit: 'rouge', circuitNumber: 5, style: 'toit' },
      { name: 'La Joker', grade: '7a', circuit: null, circuitNumber: null, style: 'devers' },
      { name: 'Big Boss', grade: '7b', circuit: null, circuitNumber: null, style: 'toit' },
      { name: 'La Prestat', grade: '5c', circuit: 'bleu', circuitNumber: 3, style: 'dalle' },
      { name: 'Le Carnage', grade: '7a+', circuit: null, circuitNumber: null, style: 'devers' },
      { name: 'Le Toit du Cul de Chien', grade: '6c', circuit: 'rouge', circuitNumber: 12, style: 'toit' },
      { name: 'La Dalle de la Rivière', grade: '4a', circuit: 'jaune', circuitNumber: 2, style: 'dalle' },
      { name: 'Le Bouchon', grade: '3c', circuit: 'jaune', circuitNumber: 7, style: 'bloc' },
    ]),

    // ── Apremont (family-friendly) ──
    ...createSectorBoulders('Apremont', 2.6350, 48.4295, [
      { name: 'Le Toit de Sainte-Catherine', grade: '4a', circuit: 'jaune', circuitNumber: 1, style: 'toit' },
      { name: "L'Angle de Sainte-Catherine", grade: '5b', circuit: 'bleu', circuitNumber: 4, style: 'arete' },
      { name: 'La Dalle du Cul de Chien', grade: '3a', circuit: 'jaune', circuitNumber: 15, style: 'dalle' },
      { name: "L'Arête du Diplomate", grade: '5c', circuit: 'bleu', circuitNumber: 9, style: 'arete' },
      { name: 'Le Dièdre des Désespérés', grade: '6a+', circuit: 'rouge', circuitNumber: 2, style: 'devers' },
      { name: 'La Barre Fixe', grade: '4c', circuit: 'bleu', circuitNumber: 11, style: 'traverse' },
      { name: 'Le Mur de la Petite Montagne', grade: '3b', circuit: 'jaune', circuitNumber: 20, style: 'dalle' },
      { name: 'La Baleine', grade: '5a', circuit: 'bleu', circuitNumber: 7, style: 'bloc' },
    ]),

    // ── Franchard Isatis ──
    ...createSectorBoulders('Franchard Isatis', 2.5950, 48.3980, [
      { name: "L'Angle Parfait", grade: '6a', circuit: 'rouge', circuitNumber: 1, style: 'arete' },
      { name: 'La Traversée de Franchard', grade: '5b', circuit: 'bleu', circuitNumber: 6, style: 'traverse' },
      { name: 'Le Mur Poli', grade: '4a', circuit: 'jaune', circuitNumber: 3, style: 'dalle' },
      { name: 'Le Surplomb Jaune', grade: '3c', circuit: 'jaune', circuitNumber: 12, style: 'devers' },
      { name: 'Le Toit de Franchard', grade: '6b', circuit: 'rouge', circuitNumber: 5, style: 'toit' },
      { name: 'La Fissure Isatis', grade: '5a', circuit: 'bleu', circuitNumber: 15, style: 'bloc' },
      { name: 'Le Bouddha', grade: '7a', circuit: null, circuitNumber: null, style: 'devers' },
      { name: 'La Dalle à Fernand', grade: '4b', circuit: 'jaune', circuitNumber: 18, style: 'dalle' },
    ]),

    // ── Roche aux Sabots ──
    ...createSectorBoulders('Roche aux Sabots', 2.6100, 48.3850, [
      { name: 'La Dalle aux Sabots', grade: '5a', circuit: 'bleu', circuitNumber: 1, style: 'dalle' },
      { name: "L'Oeuf", grade: '4b', circuit: 'jaune', circuitNumber: 5, style: 'bloc' },
      { name: 'Le Petit Toit', grade: '6a', circuit: 'rouge', circuitNumber: 3, style: 'toit' },
      { name: 'La Traversée des Sabots', grade: '5c', circuit: 'bleu', circuitNumber: 8, style: 'traverse' },
      { name: 'Le Mur du Fond', grade: '3a', circuit: 'jaune', circuitNumber: 14, style: 'dalle' },
      { name: "L'Arête des Sabots", grade: '6b+', circuit: 'rouge', circuitNumber: 7, style: 'arete' },
      { name: 'Le Surplomb des Sabots', grade: '7a+', circuit: null, circuitNumber: null, style: 'devers' },
    ]),

    // ── Cuvier Rempart ──
    ...createSectorBoulders('Cuvier Rempart', 2.6380, 48.4480, [
      { name: 'Le Mur des Escaladeurs', grade: '5b', circuit: 'bleu', circuitNumber: 2, style: 'dalle' },
      { name: 'La Dalle du Rempart', grade: '4a', circuit: 'jaune', circuitNumber: 4, style: 'dalle' },
      { name: "L'Arête du Rempart", grade: '6a+', circuit: 'rouge', circuitNumber: 1, style: 'arete' },
      { name: 'Le Toit Classique', grade: '6b', circuit: 'rouge', circuitNumber: 9, style: 'toit' },
      { name: 'La Traversée du Rempart', grade: '5a', circuit: 'bleu', circuitNumber: 10, style: 'traverse' },
      { name: 'Le Surplomb du Rempart', grade: '7a', circuit: null, circuitNumber: null, style: 'devers' },
      { name: "L'Éléphant", grade: '3b', circuit: 'jaune', circuitNumber: 12, style: 'bloc' },
      { name: 'Le Bec de Perroquet', grade: '5c', circuit: 'bleu', circuitNumber: 15, style: 'arete' },
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
