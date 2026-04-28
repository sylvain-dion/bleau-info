/**
 * Personal achievement badges (Story 14.1).
 *
 * Derives earned/locked badge status from a user's aggregate stats.
 * Public profiles supply only the core five stats; the signed-in user
 * can additionally unlock "style" badges from raw tick data.
 */

import type { Tick } from '@/lib/validations/tick'
import { getBoulderById } from '@/lib/data/boulder-service'
import { getGradeIndex } from '@/lib/grades'
import { computeStreakStats } from '@/lib/streaks'

export type BadgeCategory =
  | 'volume'
  | 'grade'
  | 'diversity'
  | 'explore'
  | 'circuit'
  | 'style'
  | 'streak'

export interface BadgeDefinition {
  id: string
  category: BadgeCategory
  label: string
  description: string
  /** Threshold value against the input field for this category */
  threshold: number
  /** Lucide icon name — resolved client-side in the badge component */
  icon:
    | 'Trophy'
    | 'Mountain'
    | 'Map'
    | 'Route'
    | 'Award'
    | 'Zap'
    | 'Eye'
    | 'Flame'
    | 'CalendarDays'
    | 'Star'
  /** Tailwind text color class when earned */
  color: string
}

export interface BadgeInput {
  tickCount: number
  uniqueBoulders: number
  maxGrade: string
  sectorsVisited: number
  circuitsCompleted: number
  /** Optional: number of ticks with tickStyle='flash' (current user only) */
  flashCount?: number
  /** Optional: number of ticks with tickStyle='a_vue' (current user only) */
  onsightCount?: number
  /** Optional: number of unique YYYY-MM-DD tick dates (current user only) */
  uniqueClimbingDays?: number
  /** Optional: longest run of consecutive climbing days ever achieved */
  longestStreak?: number
}

export interface EarnedBadge {
  definition: BadgeDefinition
  earned: true
  /** Current value at the moment of computation (for display) */
  value: number
}

export interface LockedBadge {
  definition: BadgeDefinition
  earned: false
  /** Current value, even if below threshold */
  value: number
  /** 0..1 progress toward the threshold */
  progress: number
}

export type BadgeStatus = EarnedBadge | LockedBadge

// ---------------------------------------------------------------------------
// Badge catalog
// ---------------------------------------------------------------------------

/**
 * Badge definitions, ordered by category and then threshold.
 * The UI sorts earned first, then preserves this category order.
 */
export const BADGE_CATALOG: readonly BadgeDefinition[] = [
  // Volume — tickCount
  {
    id: 'volume-1',
    category: 'volume',
    label: 'Premier Bloc',
    description: '1ère croix enregistrée',
    threshold: 1,
    icon: 'Star',
    color: 'text-emerald-500',
  },
  {
    id: 'volume-10',
    category: 'volume',
    label: 'Habitué',
    description: '10 croix',
    threshold: 10,
    icon: 'Star',
    color: 'text-emerald-500',
  },
  {
    id: 'volume-50',
    category: 'volume',
    label: 'Régulier',
    description: '50 croix',
    threshold: 50,
    icon: 'Star',
    color: 'text-emerald-600',
  },
  {
    id: 'volume-100',
    category: 'volume',
    label: 'Centurion',
    description: '100 croix',
    threshold: 100,
    icon: 'Trophy',
    color: 'text-amber-500',
  },
  {
    id: 'volume-500',
    category: 'volume',
    label: 'Légende',
    description: '500 croix',
    threshold: 500,
    icon: 'Trophy',
    color: 'text-amber-600',
  },

  // Grade — maxGrade (threshold is the index of the entry grade for the degree)
  {
    id: 'grade-5',
    category: 'grade',
    label: '5ᵉ degré',
    description: 'Réussir un 5a',
    threshold: gradeIdx('5a'),
    icon: 'Mountain',
    color: 'text-sky-500',
  },
  {
    id: 'grade-6',
    category: 'grade',
    label: '6ᵉ degré',
    description: 'Réussir un 6a',
    threshold: gradeIdx('6a'),
    icon: 'Mountain',
    color: 'text-sky-600',
  },
  {
    id: 'grade-7',
    category: 'grade',
    label: '7ᵉ degré',
    description: 'Réussir un 7a',
    threshold: gradeIdx('7a'),
    icon: 'Mountain',
    color: 'text-indigo-500',
  },
  {
    id: 'grade-8',
    category: 'grade',
    label: '8ᵉ degré',
    description: 'Réussir un 8a',
    threshold: gradeIdx('8a'),
    icon: 'Mountain',
    color: 'text-fuchsia-500',
  },

  // Diversity — uniqueBoulders
  {
    id: 'diversity-25',
    category: 'diversity',
    label: 'Collectionneur',
    description: '25 blocs différents',
    threshold: 25,
    icon: 'Award',
    color: 'text-purple-500',
  },
  {
    id: 'diversity-100',
    category: 'diversity',
    label: 'Archiviste',
    description: '100 blocs différents',
    threshold: 100,
    icon: 'Award',
    color: 'text-purple-600',
  },
  {
    id: 'diversity-250',
    category: 'diversity',
    label: 'Encyclopédiste',
    description: '250 blocs différents',
    threshold: 250,
    icon: 'Award',
    color: 'text-purple-700',
  },

  // Explore — sectorsVisited
  {
    id: 'explore-3',
    category: 'explore',
    label: 'Nomade',
    description: '3 secteurs visités',
    threshold: 3,
    icon: 'Map',
    color: 'text-blue-500',
  },
  {
    id: 'explore-6',
    category: 'explore',
    label: 'Voyageur',
    description: '6 secteurs visités',
    threshold: 6,
    icon: 'Map',
    color: 'text-blue-600',
  },
  {
    id: 'explore-10',
    category: 'explore',
    label: 'Globe-trotter',
    description: '10 secteurs visités',
    threshold: 10,
    icon: 'Map',
    color: 'text-cyan-600',
  },

  // Circuits — circuitsCompleted
  {
    id: 'circuit-1',
    category: 'circuit',
    label: 'Premier Circuit',
    description: '1 circuit terminé',
    threshold: 1,
    icon: 'Route',
    color: 'text-orange-500',
  },
  {
    id: 'circuit-5',
    category: 'circuit',
    label: 'Enchaîneur',
    description: '5 circuits terminés',
    threshold: 5,
    icon: 'Route',
    color: 'text-orange-600',
  },
  {
    id: 'circuit-10',
    category: 'circuit',
    label: 'Maître des circuits',
    description: '10 circuits terminés',
    threshold: 10,
    icon: 'Route',
    color: 'text-red-600',
  },

  // Style — flashCount / onsightCount / uniqueClimbingDays (current user only)
  {
    id: 'flash-10',
    category: 'style',
    label: 'Flash Apprenti',
    description: '10 flashs',
    threshold: 10,
    icon: 'Zap',
    color: 'text-amber-500',
  },
  {
    id: 'flash-50',
    category: 'style',
    label: 'Flash Master',
    description: '50 flashs',
    threshold: 50,
    icon: 'Zap',
    color: 'text-amber-600',
  },
  {
    id: 'onsight-10',
    category: 'style',
    label: 'À Vue Expert',
    description: '10 croix à vue',
    threshold: 10,
    icon: 'Eye',
    color: 'text-blue-500',
  },
  {
    id: 'days-30',
    category: 'style',
    label: 'Passionné',
    description: '30 jours de grimpe',
    threshold: 30,
    icon: 'CalendarDays',
    color: 'text-rose-500',
  },

  // Streaks — longestStreak (current user only)
  {
    id: 'streak-3',
    category: 'streak',
    label: 'En forme',
    description: '3 jours consécutifs',
    threshold: 3,
    icon: 'Flame',
    color: 'text-orange-500',
  },
  {
    id: 'streak-7',
    category: 'streak',
    label: 'Semaine de feu',
    description: '7 jours consécutifs',
    threshold: 7,
    icon: 'Flame',
    color: 'text-orange-600',
  },
  {
    id: 'streak-30',
    category: 'streak',
    label: 'Mois marathon',
    description: '30 jours consécutifs',
    threshold: 30,
    icon: 'Flame',
    color: 'text-red-600',
  },
] as const

/** Display order for categories (earned badges sort first within this order). */
const CATEGORY_ORDER: readonly BadgeCategory[] = [
  'volume',
  'grade',
  'diversity',
  'explore',
  'circuit',
  'style',
  'streak',
]

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

/**
 * Helper: resolve a grade string to its scale index.
 * Returns -1 for unknown grades (never earns a grade badge).
 */
function gradeIdx(grade: string): number {
  return getGradeIndex(grade)
}

/**
 * Pick the current value for a badge based on its category.
 * Style badges read optional fields; when missing, return null
 * so the badge is excluded from the output entirely.
 */
function valueFor(def: BadgeDefinition, input: BadgeInput): number | null {
  switch (def.category) {
    case 'volume':
      return input.tickCount
    case 'grade':
      return gradeIdx(input.maxGrade)
    case 'diversity':
      return input.uniqueBoulders
    case 'explore':
      return input.sectorsVisited
    case 'circuit':
      return input.circuitsCompleted
    case 'style':
      if (def.id === 'flash-10' || def.id === 'flash-50') {
        return input.flashCount ?? null
      }
      if (def.id === 'onsight-10') {
        return input.onsightCount ?? null
      }
      if (def.id === 'days-30') {
        return input.uniqueClimbingDays ?? null
      }
      return null
    case 'streak':
      return input.longestStreak ?? null
  }
}

/**
 * Compute earned/locked status for every badge in the catalog.
 *
 * Ordering: earned badges first, then locked, each sub-list sorted
 * by category order then by the catalog order within the category.
 * Style badges are omitted when the required optional input is missing.
 */
export function computeBadges(input: BadgeInput): BadgeStatus[] {
  const statuses: BadgeStatus[] = []

  for (const def of BADGE_CATALOG) {
    const value = valueFor(def, input)
    if (value === null) continue

    if (value >= def.threshold) {
      statuses.push({ definition: def, earned: true, value })
    } else {
      const progress =
        def.threshold > 0 ? Math.max(0, Math.min(1, value / def.threshold)) : 0
      statuses.push({ definition: def, earned: false, value, progress })
    }
  }

  statuses.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1
    const ca = CATEGORY_ORDER.indexOf(a.definition.category)
    const cb = CATEGORY_ORDER.indexOf(b.definition.category)
    if (ca !== cb) return ca - cb
    // Stable within category — catalog order
    const ia = BADGE_CATALOG.indexOf(a.definition)
    const ib = BADGE_CATALOG.indexOf(b.definition)
    return ia - ib
  })

  return statuses
}

/**
 * Derive a `BadgeInput` from raw tick-store data + circuit completions.
 * Shared between `computeBadgesFromTicks` and the goals section so both
 * read from a single source of truth.
 */
export function deriveBadgeInputFromTicks(
  ticks: Tick[],
  circuitCompletions: Record<string, unknown>,
): Required<Pick<BadgeInput,
  | 'tickCount'
  | 'uniqueBoulders'
  | 'maxGrade'
  | 'sectorsVisited'
  | 'circuitsCompleted'
  | 'flashCount'
  | 'onsightCount'
  | 'uniqueClimbingDays'
  | 'longestStreak'
>> {
  const uniqueBoulderIds = new Set<string>()
  const uniqueSectors = new Set<string>()
  const uniqueDays = new Set<string>()
  let maxGradeIndex = -1
  let maxGrade = ''
  let flashCount = 0
  let onsightCount = 0

  for (const tick of ticks) {
    uniqueBoulderIds.add(tick.boulderId)
    uniqueDays.add(tick.tickDate)

    const idx = getGradeIndex(tick.boulderGrade)
    if (idx > maxGradeIndex) {
      maxGradeIndex = idx
      maxGrade = tick.boulderGrade
    }

    if (tick.tickStyle === 'flash') flashCount++
    else if (tick.tickStyle === 'a_vue') onsightCount++

    const boulder = getBoulderById(tick.boulderId)
    if (boulder) uniqueSectors.add(boulder.sector)
  }

  const streak = computeStreakStats(ticks)

  return {
    tickCount: ticks.length,
    uniqueBoulders: uniqueBoulderIds.size,
    maxGrade,
    sectorsVisited: uniqueSectors.size,
    circuitsCompleted: Object.keys(circuitCompletions).length,
    flashCount,
    onsightCount,
    uniqueClimbingDays: uniqueDays.size,
    longestStreak: streak.longestStreak,
  }
}

/**
 * Derive a BadgeInput from raw tick-store data + circuit completions,
 * then compute badge status. Used on the authenticated user's own profile.
 */
export function computeBadgesFromTicks(
  ticks: Tick[],
  circuitCompletions: Record<string, unknown>,
): BadgeStatus[] {
  return computeBadges(deriveBadgeInputFromTicks(ticks, circuitCompletions))
}
