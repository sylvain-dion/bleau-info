import { z } from 'zod'
import { GRADE_SCALE } from '@/lib/grades'

/** Available predefined avatar presets (climbing-themed) */
export const AVATAR_PRESETS = [
  { key: 'climber', emoji: '🧗', label: 'Grimpeur' },
  { key: 'mountain', emoji: '🏔️', label: 'Montagne' },
  { key: 'rock', emoji: '🪨', label: 'Rocher' },
  { key: 'forest', emoji: '🌲', label: 'Forêt' },
  { key: 'fire', emoji: '🔥', label: 'Feu' },
  { key: 'star', emoji: '⭐', label: 'Étoile' },
  { key: 'lightning', emoji: '⚡', label: 'Éclair' },
  { key: 'trophy', emoji: '🏆', label: 'Trophée' },
] as const

export type AvatarPresetKey = (typeof AVATAR_PRESETS)[number]['key']

/** Get the avatar preset config by key */
export function getAvatarPreset(key: string) {
  return AVATAR_PRESETS.find((p) => p.key === key) ?? null
}

/** Schema for profile form validation */
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(30, 'Le nom ne peut pas dépasser 30 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/, 'Caractères non autorisés'),
  maxGrade: z
    .string()
    .refine((val) => val === '' || (GRADE_SCALE as readonly string[]).includes(val), {
      message: 'Cotation invalide',
    }),
  avatarPreset: z
    .string()
    .refine(
      (val) => val === '' || AVATAR_PRESETS.some((p) => p.key === val),
      { message: 'Avatar invalide' }
    ),
})

export type ProfileFormData = z.infer<typeof profileSchema>
