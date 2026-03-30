/**
 * Mock community grade votes for demo purposes (Story 12.5).
 *
 * Simulates perceived grade votes from multiple community members
 * so that the reliability badges ("Cotation vérifiée" / "Cotation disputée")
 * are visible without requiring real user data.
 *
 * Will be replaced by Supabase aggregate queries in a future epic.
 */

import type { Tick } from '@/lib/validations/tick'

interface MockVoteConfig {
  boulderId: string
  boulderName: string
  boulderGrade: string
  /** Array of perceived grades from mock community voters */
  votes: string[]
}

/**
 * Mock community votes for select boulders.
 *
 * - La Marie-Rose (6a): 12 tight votes → "Cotation vérifiée"
 * - Big Boss (7b): 8 spread votes → "Cotation disputée"
 * - L'Hélicoptère (6b+): 6 moderate votes → basic consensus (no badge)
 * - Le Bouddha (7a): 10 tight votes → "Cotation vérifiée"
 * - L'Abbatiale (6a): 7 spread votes → "Cotation disputée"
 */
const MOCK_VOTES: MockVoteConfig[] = [
  {
    // Verified: 12 votes all on 6a → stdDev = 0
    boulderId: 'cul-de-chien-1',
    boulderName: 'La Marie-Rose',
    boulderGrade: '6a',
    votes: ['6a', '6a', '6a', '6a', '6a', '6a', '6a', '6a', '6a', '6a', '6a', '6a'],
  },
  {
    // Disputed: votes from 6b to 7b+ → high stdDev
    boulderId: 'bas-cuvier-4',
    boulderName: 'Big Boss',
    boulderGrade: '7b',
    votes: ['6b', '7a', '7b+', '6c', '7c', '7a+', '6b+', '7b'],
  },
  {
    // Basic consensus: 6 votes around 6b+/6c → moderate spread, no badge
    boulderId: 'bas-cuvier-2',
    boulderName: "L'Hélicoptère",
    boulderGrade: '6b+',
    votes: ['6b', '6b+', '6c', '6b+', '6c', '6b'],
  },
  {
    // Verified: 10 tight votes on 7a
    boulderId: 'franchard-isatis-7',
    boulderName: 'Le Bouddha',
    boulderGrade: '7a',
    votes: ['7a', '7a', '7a', '7a', '7a+', '7a', '7a', '7a', '7a', '7a'],
  },
  {
    // Disputed: 7 votes spread from 5c to 6b
    boulderId: 'bas-cuvier-1',
    boulderName: "L'Abbatiale",
    boulderGrade: '6a',
    votes: ['5c', '6a+', '5b', '6b', '6a', '5c', '6a+'],
  },
]

/**
 * Generate mock community tick objects for perceived grade display.
 *
 * These ticks use a `community-` user ID prefix to distinguish
 * them from real local ticks.
 */
export function getMockCommunityTicks(): Tick[] {
  const ticks: Tick[] = []

  for (const config of MOCK_VOTES) {
    for (let i = 0; i < config.votes.length; i++) {
      ticks.push({
        id: `community-${config.boulderId}-${i}`,
        userId: `community-user-${i}`,
        boulderId: config.boulderId,
        boulderName: config.boulderName,
        boulderGrade: config.boulderGrade,
        tickStyle: 'travaille',
        tickDate: `2026-03-${String(i + 1).padStart(2, '0')}`,
        personalNote: '',
        perceivedGrade: config.votes[i],
        syncStatus: 'synced',
        createdAt: `2026-03-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`,
      })
    }
  }

  return ticks
}

/** Boulder IDs that have mock community grade data */
export const MOCK_GRADED_BOULDER_IDS = new Set(
  MOCK_VOTES.map((v) => v.boulderId)
)
