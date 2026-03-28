'use client'

import { useState } from 'react'
import { Bell, BellOff, Thermometer, Wind, Droplets, Zap } from 'lucide-react'
import { useWeatherAlertsStore } from '@/stores/weather-alerts-store'
import { toast } from 'sonner'

/**
 * Weather alerts configuration panel for the profile page.
 *
 * Opt-in toggle + criteria sliders (temp, wind, dry days).
 */
export function WeatherAlertsConfig() {
  const enabled = useWeatherAlertsStore((s) => s.enabled)
  const criteria = useWeatherAlertsStore((s) => s.criteria)
  const setEnabled = useWeatherAlertsStore((s) => s.setEnabled)
  const setCriteria = useWeatherAlertsStore((s) => s.setCriteria)
  const addAlert = useWeatherAlertsStore((s) => s.addAlert)

  const TEST_SECTORS = [
    { name: 'Cul de Chien', slug: 'cul-de-chien' },
    { name: 'Franchard Isatis', slug: 'franchard-isatis' },
    { name: 'Bas Cuvier', slug: 'bas-cuvier' },
  ]

  function handleTestAlert() {
    const sector = TEST_SECTORS[Math.floor(Math.random() * TEST_SECTORS.length)]
    const added = addAlert(
      sector.name,
      sector.slug,
      `☀️ Conditions favorables — Sec, 18°C, vent faible. Fenêtre idéale pour grimper !`
    )
    if (added) {
      toast.success(`Alerte test envoyée pour ${sector.name}`)
    } else {
      toast.info('Alerte déjà envoyée aujourd\'hui pour ce secteur')
    }
  }

  return (
    <div>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
          enabled
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-card'
        }`}
      >
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            Alertes conditions favorables
          </span>
        </div>
        <div
          className={`h-5 w-9 rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <div
            className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* Criteria (visible when enabled) */}
      {enabled && (
        <div className="mt-3 space-y-3 rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Vous serez notifié quand vos secteurs favoris remplissent ces
            critères (max 1 alerte par secteur par jour).
          </p>

          <CriteriaSlider
            icon={<Thermometer className="h-3.5 w-3.5 text-amber-500" />}
            label="Température min"
            value={criteria.tempMin}
            min={-5}
            max={25}
            unit="°C"
            onChange={(v) => setCriteria({ tempMin: v })}
          />

          <CriteriaSlider
            icon={<Thermometer className="h-3.5 w-3.5 text-red-500" />}
            label="Température max"
            value={criteria.tempMax}
            min={15}
            max={45}
            unit="°C"
            onChange={(v) => setCriteria({ tempMax: v })}
          />

          <CriteriaSlider
            icon={<Wind className="h-3.5 w-3.5 text-cyan-500" />}
            label="Vent max"
            value={criteria.windMax}
            min={5}
            max={50}
            unit="km/h"
            onChange={(v) => setCriteria({ windMax: v })}
          />

          <CriteriaSlider
            icon={<Droplets className="h-3.5 w-3.5 text-blue-500" />}
            label="Jours sans pluie min"
            value={criteria.dryDaysMin}
            min={0}
            max={7}
            unit="j"
            onChange={(v) => setCriteria({ dryDaysMin: v })}
          />

          {/* Test button (dev only) */}
          <button
            type="button"
            onClick={handleTestAlert}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Zap className="h-3.5 w-3.5" />
            Simuler une alerte
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function CriteriaSlider({
  icon,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-foreground">{label}</span>
        </div>
        <span className="text-xs font-bold text-foreground">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />
    </div>
  )
}
