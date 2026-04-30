/**
 * Story 15.3 — Seed data for "Grimpons ensemble" broadcasts.
 *
 * The seed is computed relative to today so the demo never shows
 * past calls. Each entry pairs a host with a sector, and a couple
 * of pre-existing RSVPs to give the empty state some substance.
 */

import type {
  ClimbingCall,
  CallResponse,
} from '@/lib/validations/climbing-call'

/** Add `days` to a Date and return YYYY-MM-DD in local time. */
function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MOCK_HOSTS = [
  { id: 'climber-1', name: 'Marie Dupont' },
  { id: 'climber-2', name: 'Thomas Martin' },
  { id: 'climber-3', name: 'Lucas Petit' },
] as const

export const mockClimbingCalls: ClimbingCall[] = [
  {
    id: 'call-seed-1',
    hostUserId: MOCK_HOSTS[0].id,
    hostName: MOCK_HOSTS[0].name,
    sectorSlug: 'cul-de-chien',
    sectorName: 'Cul de Chien',
    plannedDate: addDays(2),
    startTime: '10:00',
    targetGrade: '6a — 7a',
    message:
      'Session matinale, je veux essayer la Marie-Rose. Café au parking à 9h45 si vous voulez !',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'call-seed-2',
    hostUserId: MOCK_HOSTS[1].id,
    hostName: MOCK_HOSTS[1].name,
    sectorSlug: 'apremont',
    sectorName: 'Apremont',
    plannedDate: addDays(5),
    targetGrade: 'Tout niveau',
    message:
      "Sortie chill samedi, plutôt 5/6, on prend le pique-nique. Bienvenue aux débutants !",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'call-seed-3',
    hostUserId: MOCK_HOSTS[2].id,
    hostName: MOCK_HOSTS[2].name,
    sectorSlug: 'bas-cuvier',
    sectorName: 'Bas Cuvier',
    plannedDate: addDays(9),
    startTime: '14:00',
    message:
      "Petite session après-midi pour bosser quelques classiques, qui me suit ?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
]

export const mockCallResponses: CallResponse[] = [
  {
    callId: 'call-seed-1',
    userId: 'climber-2',
    userName: 'Thomas Martin',
    status: 'going',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    callId: 'call-seed-1',
    userId: 'climber-3',
    userName: 'Lucas Petit',
    status: 'maybe',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    callId: 'call-seed-2',
    userId: 'climber-1',
    userName: 'Marie Dupont',
    status: 'going',
    respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
]
