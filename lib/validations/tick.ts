import { z } from 'zod'

/**
 * Tick (ascension) styles for bouldering.
 *
 * - flash: First try, no beta, no falls
 * - a_vue: First try after previewing the boulder
 * - travaille: Success after multiple sessions/attempts
 */
export const TICK_STYLES = ['flash', 'a_vue', 'travaille'] as const
export type TickStyle = (typeof TICK_STYLES)[number]

export interface TickStyleConfig {
  key: TickStyle
  label: string
  icon: string
  /** Tailwind color class for the selected state */
  color: string
  /** Tailwind bg tint for selected state */
  bgTint: string
  /** Tailwind border color for selected state */
  borderColor: string
}

export const TICK_STYLE_OPTIONS: readonly TickStyleConfig[] = [
  {
    key: 'flash',
    label: 'Flash',
    icon: '⚡',
    color: 'text-amber-500',
    bgTint: 'bg-amber-500/10',
    borderColor: 'border-amber-500',
  },
  {
    key: 'a_vue',
    label: 'À vue',
    icon: '👁️',
    color: 'text-blue-500',
    bgTint: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  {
    key: 'travaille',
    label: 'Travaillé',
    icon: '💪',
    color: 'text-primary',
    bgTint: 'bg-primary/10',
    borderColor: 'border-primary',
  },
] as const

/** Zod schema for the tick logging form. */
export const tickFormSchema = z.object({
  tickStyle: z.enum(TICK_STYLES, {
    message: 'Veuillez sélectionner un style',
  }),
  tickDate: z
    .string()
    .min(1, 'La date est requise')
    .refine((val) => !isNaN(Date.parse(val)), 'Date invalide'),
  personalNote: z
    .string()
    .max(500, 'La note ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
})

export type TickFormData = z.infer<typeof tickFormSchema>

/**
 * Full stored tick object. Includes boulder metadata
 * for display without needing to look up the boulder.
 */
export interface Tick {
  id: string
  userId: string
  boulderId: string
  boulderName: string
  boulderGrade: string
  tickStyle: TickStyle
  tickDate: string
  personalNote: string
  /** Community grade — perceived difficulty (Story 12.1) */
  perceivedGrade: string | null
  /** Sync queue status (Story 6.2) */
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict' | 'error'
  createdAt: string
}

/** Returns today's date as YYYY-MM-DD string. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
