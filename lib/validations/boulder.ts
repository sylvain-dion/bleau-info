import { z } from 'zod'
import { GRADE_SCALE } from '@/lib/grades'
import { parseVideoUrl } from '@/lib/video'

/**
 * Boulder climbing styles (FR-20).
 * Used for classification and filtering on the map.
 */
export const BOULDER_STYLES = [
  'dalle',
  'devers',
  'toit',
  'arete',
  'traverse',
  'bloc',
] as const

export type BoulderStyleValue = (typeof BOULDER_STYLES)[number]

/** Sun exposure / drying conditions */
export const BOULDER_EXPOSURES = ['ombre', 'soleil', 'mi-ombre'] as const

export type BoulderExposureValue = (typeof BOULDER_EXPOSURES)[number]

/** French display labels for climbing styles */
export const STYLE_LABELS: Record<BoulderStyleValue, string> = {
  dalle: 'Dalle',
  devers: 'Dévers',
  toit: 'Toit',
  arete: 'Arête',
  traverse: 'Traversée',
  bloc: 'Bloc',
}

/** Visual config for style chips (icon + colors) */
export interface StyleChipConfig {
  key: BoulderStyleValue
  label: string
  icon: string
  color: string
  bgTint: string
  borderColor: string
}

export const STYLE_CHIP_OPTIONS: readonly StyleChipConfig[] = [
  { key: 'dalle', label: 'Dalle', icon: '📐', color: 'text-sky-600', bgTint: 'bg-sky-500/10', borderColor: 'border-sky-500' },
  { key: 'devers', label: 'Dévers', icon: '🧗', color: 'text-violet-600', bgTint: 'bg-violet-500/10', borderColor: 'border-violet-500' },
  { key: 'toit', label: 'Toit', icon: '🏠', color: 'text-red-600', bgTint: 'bg-red-500/10', borderColor: 'border-red-500' },
  { key: 'arete', label: 'Arête', icon: '🔪', color: 'text-emerald-600', bgTint: 'bg-emerald-500/10', borderColor: 'border-emerald-500' },
  { key: 'traverse', label: 'Traversée', icon: '↔️', color: 'text-amber-600', bgTint: 'bg-amber-500/10', borderColor: 'border-amber-500' },
  { key: 'bloc', label: 'Bloc', icon: '🪨', color: 'text-stone-600', bgTint: 'bg-stone-500/10', borderColor: 'border-stone-500' },
] as const

/** French display labels for exposure */
export const EXPOSURE_LABELS: Record<BoulderExposureValue, string> = {
  ombre: 'À l\'ombre',
  soleil: 'Au soleil',
  'mi-ombre': 'Mi-ombre',
}

/**
 * Zod schema for the boulder creation form (Story 5.1).
 *
 * Required: name, grade, style.
 * Optional: sector, description, height, exposure, strollerAccessible.
 */
export const boulderFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  grade: z
    .string()
    .min(1, 'La cotation est requise')
    .refine(
      (val) => (GRADE_SCALE as readonly string[]).includes(val),
      'Cotation invalide'
    ),

  style: z.enum(BOULDER_STYLES, {
    message: 'Le style de grimpe est requis',
  }),

  sector: z
    .string()
    .max(100, 'Le secteur ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),

  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),

  height: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val === '') return undefined
      const num = parseFloat(val)
      return isNaN(num) ? undefined : num
    })
    .pipe(
      z
        .number()
        .min(0.5, 'La hauteur minimale est 0,5 m')
        .max(15, 'La hauteur maximale est 15 m')
        .optional()
    ),

  exposure: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val === '') return undefined
      return val
    })
    .pipe(z.enum(BOULDER_EXPOSURES).optional()),

  strollerAccessible: z.boolean().default(false),

  /** YouTube or Vimeo video URL (Story 5.7) */
  videoUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val === '') return undefined
      return val
    })
    .pipe(
      z
        .string()
        .refine(
          (val) => parseVideoUrl(val) !== null,
          'URL YouTube ou Vimeo invalide'
        )
        .optional()
    ),

  /** Photo metadata (Story 5.2) — only persisted fields, not the data URL */
  photoBlurHash: z.string().optional(),
  photoWidth: z.number().int().positive().optional(),
  photoHeight: z.number().int().positive().optional(),

  /** GPS coordinates (Story 5.3) — 6 decimal places, ~11cm precision */
  latitude: z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide').optional(),
  longitude: z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide').optional(),
})

/** Input type — what the form fields provide (height as string). */
export type BoulderFormInput = z.input<typeof boulderFormSchema>

/** Output type — after Zod transforms (height as number). */
export type BoulderFormData = z.output<typeof boulderFormSchema>

/**
 * Extract unique sector names from mock boulder data.
 * Returns sorted list for use in sector dropdown.
 */
export function extractSectors(
  features: Array<{ properties: { sector: string } }>
): string[] {
  const sectors = new Set<string>()
  for (const f of features) {
    sectors.add(f.properties.sector)
  }
  return Array.from(sectors).sort()
}
