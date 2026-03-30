/**
 * Shared mock popularity utility.
 *
 * Deterministic hash-based popularity score for boulders.
 * Will be replaced by real Supabase data in a future epic.
 */

/** Deterministic integer hash from a string (sum of char codes). */
export function hashCode(str: string): number {
  return str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

/** Mock popularity count for a boulder (0–4). Deterministic per ID. */
export function getMockPopularity(boulderId: string): number {
  return hashCode(boulderId) % 5
}
