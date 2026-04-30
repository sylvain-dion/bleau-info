/**
 * Story 15.3 — "Grimpons ensemble" broadcast validation.
 *
 * A climbing call is a public open invitation to climb at a given
 * sector on a planned date. Other users can RSVP with "going" or
 * "maybe". The call expires automatically after the planned date.
 */

import { z } from 'zod/v4'

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Zod schema for the call creation form.
 *
 * - sectorSlug + sectorName captured together so the broadcast view
 *   can render the sector label without an extra lookup.
 * - plannedDate must be today or later — past calls don't make sense.
 * - startTime is HH:MM 24-hour, optional.
 * - targetGrade is optional and free-form (not enum) to keep the form
 *   tolerant to user input ("autour de 6a", "tout").
 * - message is the only required free text but allows empty (default
 *   to a friendly placeholder rendered client-side).
 */
export const climbingCallFormSchema = z.object({
  sectorSlug: z.string().min(1, 'Choisis un secteur'),
  sectorName: z.string().min(1),
  plannedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Date invalide')
    .refine(
      (value) => value >= todayISO(),
      'La date ne peut pas être dans le passé',
    ),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/u, 'Heure invalide (HH:MM)')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  targetGrade: z
    .string()
    .max(20, '20 caractères maximum')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  message: z
    .string()
    .max(300, '300 caractères maximum')
    .optional()
    .default(''),
})

/** Input shape — what the form fields actually provide (pre-transform). */
export type ClimbingCallFormInput = z.input<typeof climbingCallFormSchema>
/** Output shape — what the resolver yields after transforms / defaults. */
export type ClimbingCallFormData = z.output<typeof climbingCallFormSchema>

/** A persisted climbing call. */
export interface ClimbingCall {
  id: string
  hostUserId: string
  hostName: string
  sectorSlug: string
  sectorName: string
  plannedDate: string // YYYY-MM-DD
  startTime?: string // HH:MM
  targetGrade?: string
  message: string
  createdAt: string // ISO timestamp
}

/** RSVP from another user to a call. */
export interface CallResponse {
  callId: string
  userId: string
  userName: string
  status: 'going' | 'maybe'
  respondedAt: string
}
