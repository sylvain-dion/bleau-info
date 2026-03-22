/**
 * Diff comparison service for moderation.
 *
 * Builds a field-by-field diff between the original boulder data
 * and a proposed modification (suggestion) or a new creation (draft).
 */

import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useSuggestionStore } from '@/stores/suggestion-store'
import { mockBoulders } from '@/lib/data/mock-boulders'
import type { QueueItem } from './queue-service'

/** A single field comparison entry */
export interface DiffField {
  key: string
  label: string
  original: unknown
  proposed: unknown
  changed: boolean
  /** Geographic field (latitude/longitude) — shown on mini-map */
  isGeo: boolean
}

/** Full comparison data for a submission */
export interface SubmissionDiff {
  /** Queue item metadata */
  item: QueueItem
  /** Field-by-field comparisons */
  fields: DiffField[]
  /** True if this is a new creation (no original to compare) */
  isCreation: boolean
  /** Original boulder name (for display) */
  originalName: string | null
  /** Proposed coordinates for map display */
  proposedCoords: { lat: number; lng: number } | null
  /** Original coordinates for map display */
  originalCoords: { lat: number; lng: number } | null
}

/** Fields to compare, with display labels */
const COMPARED_FIELDS: Array<{ key: string; label: string; isGeo: boolean }> = [
  { key: 'name', label: 'Nom', isGeo: false },
  { key: 'grade', label: 'Cotation', isGeo: false },
  { key: 'style', label: 'Style', isGeo: false },
  { key: 'sector', label: 'Secteur', isGeo: false },
  { key: 'exposure', label: 'Exposition', isGeo: false },
  { key: 'strollerAccessible', label: 'Accès poussette', isGeo: false },
  { key: 'description', label: 'Description', isGeo: false },
  { key: 'height', label: 'Hauteur (m)', isGeo: false },
  { key: 'latitude', label: 'Latitude', isGeo: true },
  { key: 'longitude', label: 'Longitude', isGeo: true },
  { key: 'videoUrl', label: 'Vidéo', isGeo: false },
]

/**
 * Build a full diff for a queue item.
 *
 * For modifications (suggestions): compares originalSnapshot with proposed values.
 * For creations (drafts): shows proposed values with no original.
 */
export function buildSubmissionDiff(item: QueueItem): SubmissionDiff {
  if (item.sourceType === 'suggestion') {
    return buildSuggestionDiff(item)
  }
  return buildDraftDiff(item)
}

function buildSuggestionDiff(item: QueueItem): SubmissionDiff {
  const suggestion = useSuggestionStore.getState().getSuggestion(item.id)
  if (!suggestion) {
    return emptyDiff(item)
  }

  const original = suggestion.originalSnapshot
  const proposed: Record<string, unknown> = {
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
    videoUrl: suggestion.videoUrl,
  }

  const originalRecord: Record<string, unknown> = {
    name: original.name,
    grade: original.grade,
    style: original.style,
    sector: original.sector,
    exposure: original.exposure,
    strollerAccessible: original.strollerAccessible,
    latitude: original.latitude,
    longitude: original.longitude,
  }

  // Try to enrich from mock data (description, height, videoUrl not in snapshot)
  const mockBoulder = findMockBoulder(suggestion.originalBoulderId)
  if (mockBoulder) {
    originalRecord.description = ''
    originalRecord.height = null
    originalRecord.videoUrl = mockBoulder.videoUrl ?? null
  }

  const fields = COMPARED_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    original: originalRecord[f.key] ?? null,
    proposed: proposed[f.key] ?? null,
    changed: !valuesEqual(originalRecord[f.key], proposed[f.key]),
    isGeo: f.isGeo,
  }))

  return {
    item,
    fields,
    isCreation: false,
    originalName: original.name,
    proposedCoords: toCoords(suggestion.latitude, suggestion.longitude),
    originalCoords: toCoords(original.latitude, original.longitude),
  }
}

function buildDraftDiff(item: QueueItem): SubmissionDiff {
  const draft = useBoulderDraftStore.getState().getDraft(item.id)
  if (!draft) {
    return emptyDiff(item)
  }

  const proposed: Record<string, unknown> = {
    name: draft.name,
    grade: draft.grade,
    style: draft.style,
    sector: draft.sector,
    exposure: draft.exposure,
    strollerAccessible: draft.strollerAccessible,
    description: draft.description,
    height: draft.height,
    latitude: draft.latitude,
    longitude: draft.longitude,
    videoUrl: draft.videoUrl,
  }

  const fields = COMPARED_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    original: null,
    proposed: proposed[f.key] ?? null,
    changed: proposed[f.key] != null,
    isGeo: f.isGeo,
  }))

  return {
    item,
    fields,
    isCreation: true,
    originalName: null,
    proposedCoords: toCoords(draft.latitude, draft.longitude),
    originalCoords: null,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyDiff(item: QueueItem): SubmissionDiff {
  return {
    item,
    fields: [],
    isCreation: true,
    originalName: null,
    proposedCoords: null,
    originalCoords: null,
  }
}

function findMockBoulder(boulderId: string) {
  for (const feature of mockBoulders.features) {
    if (feature.properties.id === boulderId) {
      return feature.properties
    }
  }
  return null
}

function toCoords(
  lat: number | null | undefined,
  lng: number | null | undefined
): { lat: number; lng: number } | null {
  if (lat == null || lng == null) return null
  return { lat, lng }
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  return JSON.stringify(a) === JSON.stringify(b)
}
