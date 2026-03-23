/**
 * Mock sync adapter that simulates network uploads and occasional conflicts.
 *
 * - 300-1000ms latency per item
 * - ~10% random failure rate for testing retry/backoff
 * - ~20% conflict rate on suggestions for testing conflict resolution
 */

import type { SyncAdapter } from './sync-adapter'
import type { SyncItemResponse } from './types'
import { useSuggestionStore } from '@/stores/suggestion-store'

const FAILURE_RATE = 0.1
const CONFLICT_RATE = 0.2

/** Simulate network latency (300-1000ms) with ~10% failure rate */
async function simulateUpload(type: string, id: string): Promise<void> {
  const delay = 300 + Math.random() * 700
  await new Promise((resolve) => setTimeout(resolve, delay))

  if (Math.random() < FAILURE_RATE) {
    throw new Error(`[MockSync] Failed to sync ${type} ${id}`)
  }

  console.log(`[MockSync] Synced ${type} ${id} (${Math.round(delay)}ms)`)
}

/**
 * Generate a fake "remote version" of a suggestion that differs
 * from the local one. Randomly mutates a few fields.
 */
function generateRemoteVersion(suggestionId: string): Record<string, unknown> {
  const suggestion = useSuggestionStore.getState().getSuggestion(suggestionId)
  if (!suggestion) return {}

  const remote: Record<string, unknown> = {
    name: suggestion.name,
    grade: suggestion.grade,
    style: suggestion.style,
    sector: suggestion.sector,
    exposure: suggestion.exposure,
    strollerAccessible: suggestion.strollerAccessible,
    description: suggestion.description,
    height: suggestion.height,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
  }

  // Randomly pick what kind of conflict to generate
  const roll = Math.random()

  if (roll < 0.4) {
    // Simple field conflict: changed grade
    const grades = ['3a', '4b', '5c', '6a+', '6b', '7a', '7b+']
    remote.grade = grades[Math.floor(Math.random() * grades.length)]
  } else if (roll < 0.7) {
    // Simple field conflict: changed name
    remote.name = `${suggestion.name} (modifié)`
  } else {
    // Geographic conflict: shift coordinates by ~15-50m
    if (suggestion.latitude != null && suggestion.longitude != null) {
      const shift = (0.00015 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1)
      remote.latitude = suggestion.latitude + shift
      remote.longitude = suggestion.longitude + shift * 0.7
    }
  }

  return remote
}

export class MockSyncAdapter implements SyncAdapter {
  async syncDraft(id: string): Promise<SyncItemResponse> {
    await simulateUpload('draft', id)
    return { status: 'synced' }
  }

  async syncSuggestion(id: string): Promise<SyncItemResponse> {
    await simulateUpload('suggestion', id)

    // ~20% chance of conflict on suggestions
    if (Math.random() < CONFLICT_RATE) {
      const remoteVersion = generateRemoteVersion(id)

      console.log(`[MockSync] Conflict detected for suggestion ${id}`)

      return {
        status: 'conflict',
        conflict: {
          remoteVersion,
          remoteUpdatedAt: new Date(Date.now() - 60_000).toISOString(),
        },
      }
    }

    return { status: 'synced' }
  }

  async syncTick(id: string): Promise<SyncItemResponse> {
    await simulateUpload('tick', id)
    return { status: 'synced' }
  }

  async syncVideo(id: string): Promise<SyncItemResponse> {
    await simulateUpload('video', id)
    return { status: 'synced' }
  }

  async syncComment(id: string): Promise<SyncItemResponse> {
    await simulateUpload('comment', id)
    return { status: 'synced' }
  }
}
