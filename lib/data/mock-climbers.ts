/**
 * Mock public climber profiles.
 *
 * In production, this would query Supabase profiles table.
 */

export interface PublicClimberProfile {
  id: string
  displayName: string
  avatarPreset: string | null
  memberSince: string
  stats: {
    tickCount: number
    uniqueBoulders: number
    maxGrade: string
    sectorsVisited: number
    circuitsCompleted: number
    /** Longest streak of consecutive climbing days (Story 14.2) */
    longestStreak: number
    /** Currently active streak in days, 0 if broken (Story 14.2) */
    currentStreak: number
  }
  recentAscensions: {
    boulderId: string
    boulderName: string
    grade: string
    sector: string
    tickDate: string
    style: string
  }[]
  privacy: {
    profilePublic: boolean
    statsPublic: boolean
    ascensionsPublic: boolean
  }
}

const MOCK_CLIMBERS: PublicClimberProfile[] = [
  {
    id: 'climber-1',
    displayName: 'Marie Dupont',
    avatarPreset: 'fox',
    memberSince: '2024-03-15',
    stats: {
      tickCount: 247,
      uniqueBoulders: 189,
      maxGrade: '7a',
      sectorsVisited: 12,
      circuitsCompleted: 5,
      longestStreak: 9,
      currentStreak: 3,
    },
    recentAscensions: [
      { boulderId: 'cul-de-chien-1', boulderName: 'La Marie-Rose', grade: '6a', sector: 'Cul de Chien', tickDate: '2026-03-25', style: 'flash' },
      { boulderId: 'bas-cuvier-3', boulderName: 'La Prestat', grade: '6b', sector: 'Bas Cuvier', tickDate: '2026-03-22', style: 'travaille' },
      { boulderId: 'apremont-2', boulderName: 'Le Belvédère', grade: '5c', sector: 'Apremont', tickDate: '2026-03-20', style: 'a_vue' },
    ],
    privacy: { profilePublic: true, statsPublic: true, ascensionsPublic: true },
  },
  {
    id: 'climber-2',
    displayName: 'Thomas Martin',
    avatarPreset: 'bear',
    memberSince: '2025-01-10',
    stats: {
      tickCount: 89,
      uniqueBoulders: 72,
      maxGrade: '6b+',
      sectorsVisited: 6,
      circuitsCompleted: 2,
      longestStreak: 5,
      currentStreak: 0,
    },
    recentAscensions: [
      { boulderId: 'franchard-1', boulderName: 'Le Toit de Franchard', grade: '6b', sector: 'Franchard Isatis', tickDate: '2026-03-26', style: 'flash' },
    ],
    privacy: { profilePublic: true, statsPublic: true, ascensionsPublic: false },
  },
  {
    id: 'climber-3',
    displayName: 'Lucas Petit',
    avatarPreset: 'owl',
    memberSince: '2025-06-20',
    stats: {
      tickCount: 34,
      uniqueBoulders: 30,
      maxGrade: '5a',
      sectorsVisited: 3,
      circuitsCompleted: 1,
      longestStreak: 2,
      currentStreak: 0,
    },
    recentAscensions: [],
    privacy: { profilePublic: false, statsPublic: false, ascensionsPublic: false },
  },
]

export function getClimberProfile(id: string): PublicClimberProfile | null {
  return MOCK_CLIMBERS.find((c) => c.id === id) ?? null
}

export function getAllClimbers(): PublicClimberProfile[] {
  return MOCK_CLIMBERS
}
