/**
 * Praticability score for sectors.
 *
 * Combines weather data (50%), sector orientation (20%),
 * and crowdsourced condition reports (30%) into a single
 * rating: sec / humide / impraticable / inconnu.
 */

import type { DayForecast } from './weather-service'
import type { ConditionValue } from '@/lib/validations/condition'
import type { BoulderExposureValue } from '@/lib/validations/boulder'

export type PraticabilityLevel = 'sec' | 'humide' | 'impraticable' | 'inconnu'

export interface PraticabilityScore {
  level: PraticabilityLevel
  /** 0-100, higher = drier/better */
  score: number
  /** Whether crowdsource data was available */
  hasCrowdsource: boolean
  /** Human-readable label */
  label: string
  /** Tailwind classes for badge */
  color: string
}

const LEVEL_CONFIG: Record<PraticabilityLevel, { label: string; color: string }> = {
  sec: { label: 'Sec', color: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400' },
  humide: { label: 'Humide', color: 'text-amber-700 bg-amber-500/10 dark:text-amber-400' },
  impraticable: { label: 'Impraticable', color: 'text-red-700 bg-red-500/10 dark:text-red-400' },
  inconnu: { label: 'Inconnu', color: 'text-zinc-500 bg-zinc-500/10' },
}

/** Weights: météo 50%, orientation 20%, crowdsource 30% */
const W_METEO = 0.5
const W_ORIENTATION = 0.2
const W_CROWDSOURCE = 0.3

/**
 * Calculate weather score (0-100) from last 2 days of forecasts.
 *
 * Low precip + low probability = high score.
 */
function weatherScore(forecasts: DayForecast[]): number | null {
  if (forecasts.length === 0) return null

  const recent = forecasts.slice(0, 2)
  let totalScore = 0

  for (const day of recent) {
    let dayScore = 100

    // Precipitation sum penalty (0-10mm → 100-0)
    dayScore -= Math.min(day.precipitationSum * 10, 100)

    // Precipitation probability penalty
    dayScore -= day.precipitationProbMax * 0.3

    // Wind penalty (high wind dries rock faster → slight bonus if dry)
    if (day.precipitationSum < 1 && day.windSpeedMax > 15) {
      dayScore += 5
    }

    totalScore += Math.max(0, Math.min(100, dayScore))
  }

  return totalScore / recent.length
}

/**
 * Orientation score (0-100).
 *
 * South-facing (soleil) dries faster after rain.
 */
function orientationScore(exposure: BoulderExposureValue | null): number {
  switch (exposure) {
    case 'soleil':
      return 90
    case 'mi-ombre':
      return 60
    case 'ombre':
      return 30
    default:
      return 50 // unknown defaults to neutral
  }
}

/**
 * Crowdsource score (0-100) from recent condition reports.
 *
 * More "sec" reports = higher score.
 */
function crowdsourceScore(reports: ConditionValue[]): number | null {
  if (reports.length === 0) return null

  const weights: Record<ConditionValue, number> = {
    sec: 100,
    humide: 30,
    gras: 15,
    mousse: 20,
    dangereux: 0,
  }

  const total = reports.reduce((sum, r) => sum + weights[r], 0)
  return total / reports.length
}

/**
 * Compute praticability score for a sector.
 *
 * @param forecasts - Recent weather forecasts (today + yesterday ideally)
 * @param dominantExposure - Most common exposure in the sector
 * @param recentConditions - Crowdsourced condition values from last 48h
 */
export function computePraticability(
  forecasts: DayForecast[],
  dominantExposure: BoulderExposureValue | null,
  recentConditions: ConditionValue[]
): PraticabilityScore {
  const meteo = weatherScore(forecasts)
  const orient = orientationScore(dominantExposure)
  const crowd = crowdsourceScore(recentConditions)

  const hasCrowdsource = crowd !== null

  // If no weather data at all, return inconnu
  if (meteo === null) {
    return {
      level: 'inconnu',
      score: 0,
      hasCrowdsource,
      ...LEVEL_CONFIG.inconnu,
    }
  }

  // Weighted average (adjust weights if crowdsource unavailable)
  let finalScore: number
  if (hasCrowdsource) {
    finalScore =
      meteo * W_METEO + orient * W_ORIENTATION + crowd! * W_CROWDSOURCE
  } else {
    // Redistribute crowdsource weight to météo
    finalScore = meteo * (W_METEO + W_CROWDSOURCE) + orient * W_ORIENTATION
  }

  finalScore = Math.round(Math.max(0, Math.min(100, finalScore)))

  let level: PraticabilityLevel
  if (finalScore >= 65) level = 'sec'
  else if (finalScore >= 35) level = 'humide'
  else level = 'impraticable'

  return {
    level,
    score: finalScore,
    hasCrowdsource,
    ...LEVEL_CONFIG[level],
  }
}
