/**
 * Drying time estimation service.
 *
 * Fetches 7-day rain history from Open-Meteo archive API
 * and estimates drying time based on cumulative rain,
 * temperature, wind, and sector exposure.
 */

const FONTAINEBLEAU_LAT = 48.4088
const FONTAINEBLEAU_LNG = 2.6988
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000

/** Exposure multipliers: lower = dries faster */
export const DRYING_COEFFICIENTS: Record<string, number> = {
  soleil: 0.6,
  'mi-ombre': 1.0,
  ombre: 1.5,
  foret: 1.8,
}

export interface RainHistoryDay {
  date: string
  dayName: string
  precipMm: number
  tempMean: number
  windMax: number
}

export interface DryingEstimate {
  hoursRemaining: number
  isDry: boolean
  confidence: 'high' | 'medium' | 'low'
  label: string
  color: string
}

export interface RainHistory {
  days: RainHistoryDay[]
  totalPrecipMm: number
  fetchedAt: string
}

interface CacheEntry {
  data: RainHistory
  expiresAt: number
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function buildCacheKey(lat: number, lng: number): string {
  return `bleau-rain-history-${lat.toFixed(2)}-${lng.toFixed(2)}`
}

/**
 * Fetch 7-day rain history from Open-Meteo archive API.
 *
 * Uses localStorage cache (3h TTL) with stale fallback on error.
 */
export async function fetchRainHistory(
  lat = FONTAINEBLEAU_LAT,
  lng = FONTAINEBLEAU_LNG
): Promise<RainHistory | null> {
  const cacheKey = buildCacheKey(lat, lng)

  // Check cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached)
        if (entry.expiresAt > Date.now()) {
          return entry.data
        }
      }
    } catch {
      // Cache miss or corrupted
    }
  }

  // Build date range: 7 days ago → yesterday
  const end = new Date()
  end.setDate(end.getDate() - 1)
  const start = new Date()
  start.setDate(start.getDate() - 7)

  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  try {
    const url = new URL('https://archive-api.open-meteo.com/v1/archive')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set('start_date', startStr)
    url.searchParams.set('end_date', endStr)
    url.searchParams.set(
      'daily',
      'precipitation_sum,temperature_2m_mean,wind_speed_10m_max'
    )
    url.searchParams.set('timezone', 'Europe/Paris')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Open-Meteo archive: ${res.status}`)

    const json = await res.json()
    const daily = json.daily

    if (!daily?.time?.length) return null

    const days: RainHistoryDay[] = daily.time.map(
      (date: string, i: number) => {
        const d = new Date(date)
        return {
          date,
          dayName: DAY_NAMES[d.getDay()],
          precipMm: daily.precipitation_sum?.[i] ?? 0,
          tempMean: daily.temperature_2m_mean?.[i] ?? 10,
          windMax: daily.wind_speed_10m_max?.[i] ?? 5,
        }
      }
    )

    const totalPrecipMm = days.reduce((sum, d) => sum + d.precipMm, 0)
    const result: RainHistory = {
      days,
      totalPrecipMm: Math.round(totalPrecipMm * 10) / 10,
      fetchedAt: new Date().toISOString(),
    }

    // Save to cache
    if (typeof window !== 'undefined') {
      try {
        const entry: CacheEntry = {
          data: result,
          expiresAt: Date.now() + CACHE_DURATION_MS,
        }
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      } catch {
        // Storage full — ignore
      }
    }

    return result
  } catch {
    // Return stale cache if available
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) return (JSON.parse(cached) as CacheEntry).data
      } catch {
        // Nothing to do
      }
    }
    return null
  }
}

/**
 * Estimate drying time from cumulative rain, temperature, wind, and exposure.
 *
 * Formula: hours = rainMm * 4 * exposureCoeff / (1 + tempAvg/20 + windAvg/30)
 */
export function estimateDryingHours(
  rainMm: number,
  tempAvg: number,
  windAvg: number,
  exposure: string | null
): DryingEstimate {
  if (rainMm < 0.5) {
    return {
      hoursRemaining: 0,
      isDry: true,
      confidence: 'high',
      label: 'Sec estimé',
      color: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
    }
  }

  const coeff = DRYING_COEFFICIENTS[exposure ?? 'mi-ombre'] ?? 1.0
  const denom = 1 + Math.max(tempAvg, 0) / 20 + Math.max(windAvg, 0) / 30
  const hours = Math.round((rainMm * 4 * coeff) / denom)

  // Confidence based on data recency (always medium for now — could be improved)
  const confidence: DryingEstimate['confidence'] =
    rainMm > 10 ? 'low' : rainMm > 3 ? 'medium' : 'high'

  if (hours <= 0) {
    return {
      hoursRemaining: 0,
      isDry: true,
      confidence,
      label: 'Sec estimé',
      color: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
    }
  }

  if (hours > 48) {
    return {
      hoursRemaining: hours,
      isDry: false,
      confidence,
      label: `Très humide (~${hours}h)`,
      color: 'text-red-700 bg-red-500/10 dark:text-red-400',
    }
  }

  return {
    hoursRemaining: hours,
    isDry: false,
    confidence,
    label: `Séchage ~${hours}h`,
    color: 'text-amber-700 bg-amber-500/10 dark:text-amber-400',
  }
}
