'use client'

import { useEffect, useState } from 'react'
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react'
import {
  fetchWeatherForecast,
  type WeatherForecast,
  type InferredCondition,
} from '@/lib/weather/weather-service'

const CONDITION_LABELS: Record<InferredCondition, { label: string; color: string }> = {
  sec: { label: 'Sec probable', color: 'text-amber-600 bg-amber-500/10' },
  humide: { label: 'Humide probable', color: 'text-blue-600 bg-blue-500/10' },
  incertain: { label: 'Incertain', color: 'text-zinc-500 bg-zinc-500/10' },
}

/**
 * 3-day weather forecast card for Fontainebleau.
 *
 * Fetches from Open-Meteo API with 30min cache.
 * Shows temperature, precipitation, wind, and inferred rock conditions.
 */
export function WeatherForecastCard() {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const data = await fetchWeatherForecast()
      if (!cancelled) {
        setForecast(data)
        setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="mb-4 animate-pulse rounded-lg border border-border bg-card p-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-2 flex gap-2">
          <div className="h-16 flex-1 rounded bg-muted" />
          <div className="h-16 flex-1 rounded bg-muted" />
          <div className="h-16 flex-1 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!forecast) return null

  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Cloud className="h-3.5 w-3.5" />
          Prévisions Fontainebleau
        </div>
        <span className="text-[10px] text-muted-foreground">
          {forecast.source}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {forecast.days.map((day) => {
          const condConfig = CONDITION_LABELS[day.inferredCondition]
          return (
            <div
              key={day.date}
              className="rounded-lg bg-muted/50 p-2 text-center"
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {day.dayName}
              </p>
              <p className="my-1 text-lg">{day.icon}</p>

              {/* Temperature */}
              <div className="flex items-center justify-center gap-1 text-xs">
                <Thermometer className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {day.tempMax}°
                </span>
                <span className="text-muted-foreground">{day.tempMin}°</span>
              </div>

              {/* Precipitation */}
              <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Droplets className="h-2.5 w-2.5" />
                {day.precipitationProbMax}%
              </div>

              {/* Wind */}
              <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Wind className="h-2.5 w-2.5" />
                {day.windSpeedMax} km/h
              </div>

              {/* Inferred condition */}
              <div className="mt-1.5">
                <span
                  className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${condConfig.color}`}
                >
                  {condConfig.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
