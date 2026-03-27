/**
 * Weather forecast service using Open-Meteo API.
 *
 * Free, no API key needed. Returns 3-day forecast for Fontainebleau
 * with inferred rock conditions based on precipitation.
 */

/** Fontainebleau forest center coordinates (fallback) */
const FONTAINEBLEAU_LAT = 48.4088
const FONTAINEBLEAU_LNG = 2.6988

/** Cache duration: 3h online (NFR-10) */
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000

/** Max age before showing staleness warning (24h) */
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000

/** Inferred rock condition from weather data */
export type InferredCondition = 'sec' | 'humide' | 'incertain'

export interface DayForecast {
  /** Date as YYYY-MM-DD */
  date: string
  /** Day name in French (Lun, Mar, Mer...) */
  dayName: string
  /** Min temperature °C */
  tempMin: number
  /** Max temperature °C */
  tempMax: number
  /** Precipitation sum in mm */
  precipitationSum: number
  /** Max precipitation probability % */
  precipitationProbMax: number
  /** WMO weather code */
  weatherCode: number
  /** Max wind speed km/h */
  windSpeedMax: number
  /** Inferred rock condition */
  inferredCondition: InferredCondition
  /** Weather icon (emoji) */
  icon: string
  /** Short description */
  description: string
}

export interface WeatherForecast {
  days: DayForecast[]
  fetchedAt: string
  source: string
}

interface CacheEntry {
  data: WeatherForecast
  expiresAt: number
}

/** French day names (short) */
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/** WMO weather code → icon + description */
function weatherCodeToInfo(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: '☀️', description: 'Ciel dégagé' }
  if (code <= 3) return { icon: '⛅', description: 'Partiellement nuageux' }
  if (code <= 49) return { icon: '☁️', description: 'Nuageux / Brouillard' }
  if (code <= 59) return { icon: '🌧️', description: 'Bruine' }
  if (code <= 69) return { icon: '🌧️', description: 'Pluie' }
  if (code <= 79) return { icon: '🌨️', description: 'Neige' }
  if (code <= 84) return { icon: '🌧️', description: 'Averses' }
  if (code <= 94) return { icon: '🌨️', description: 'Averses de neige' }
  return { icon: '⛈️', description: 'Orage' }
}

/** Infer rock condition from precipitation data */
function inferCondition(
  precipSum: number,
  precipProb: number
): InferredCondition {
  if (precipSum > 2 || precipProb > 60) return 'humide'
  if (precipSum < 0.5 && precipProb < 20) return 'sec'
  return 'incertain'
}

export interface FetchWeatherOptions {
  lat?: number
  lng?: number
  days?: 3 | 7
}

/** Build a cache key scoped to coordinates + forecast length */
function buildCacheKey(lat: number, lng: number, days: number): string {
  return `bleau-weather-${lat.toFixed(2)}-${lng.toFixed(2)}-${days}d`
}

/**
 * Fetch weather forecast from Open-Meteo API.
 *
 * Supports sector-specific coordinates and 3 or 7-day forecasts.
 * Uses client-side localStorage cache (3h TTL).
 * Returns stale cache on failure (with fetchedAt for staleness check).
 */
export async function fetchWeatherForecast(
  options?: FetchWeatherOptions
): Promise<WeatherForecast | null> {
  const lat = options?.lat ?? FONTAINEBLEAU_LAT
  const lng = options?.lng ?? FONTAINEBLEAU_LNG
  const forecastDays = options?.days ?? 3
  const cacheKey = buildCacheKey(lat, lng, forecastDays)

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
      // Ignore cache errors
    }
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lng))
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max'
    )
    url.searchParams.set('timezone', 'Europe/Paris')
    url.searchParams.set('forecast_days', String(forecastDays))

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json()
    const daily = json.daily

    if (!daily?.time?.length) return null

    const days: DayForecast[] = daily.time.map(
      (date: string, i: number) => {
        const precipSum = daily.precipitation_sum[i] ?? 0
        const precipProb = daily.precipitation_probability_max[i] ?? 0
        const code = daily.weather_code[i] ?? 0
        const { icon, description } = weatherCodeToInfo(code)
        const dayDate = new Date(date)

        return {
          date,
          dayName: DAY_NAMES[dayDate.getDay()],
          tempMin: Math.round(daily.temperature_2m_min[i] ?? 0),
          tempMax: Math.round(daily.temperature_2m_max[i] ?? 0),
          precipitationSum: precipSum,
          precipitationProbMax: precipProb,
          weatherCode: code,
          windSpeedMax: Math.round(daily.wind_speed_10m_max[i] ?? 0),
          inferredCondition: inferCondition(precipSum, precipProb),
          icon,
          description,
        }
      }
    )

    const forecast: WeatherForecast = {
      days,
      fetchedAt: new Date().toISOString(),
      source: 'Open-Meteo',
    }

    // Cache result
    if (typeof window !== 'undefined') {
      try {
        const entry: CacheEntry = {
          data: forecast,
          expiresAt: Date.now() + CACHE_DURATION_MS,
        }
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      } catch {
        // Ignore storage errors
      }
    }

    return forecast
  } catch {
    // On failure, return stale cache if available
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached)
          return entry.data // stale but better than nothing
        }
      } catch {
        // Ignore
      }
    }
    return null
  }
}
