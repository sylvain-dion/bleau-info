'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useWeatherAlertsStore } from '@/stores/weather-alerts-store'

/**
 * Bell icon in the header showing unread weather alert count.
 *
 * Clicking opens a dropdown with recent alerts.
 * Each alert links to the sector page météo tab.
 */
export function WeatherAlertsBell() {
  const [isOpen, setIsOpen] = useState(false)
  const alerts = useWeatherAlertsStore((s) => s.alerts)
  const enabled = useWeatherAlertsStore((s) => s.enabled)
  const markRead = useWeatherAlertsStore((s) => s.markRead)
  const markAllRead = useWeatherAlertsStore((s) => s.markAllRead)

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  )

  if (!enabled) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Alertes météo${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-xs font-semibold text-foreground">
                Alertes météo
              </span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Aucune alerte
                </div>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/secteurs/${alert.sectorSlug}?tab=meteo`}
                    onClick={() => {
                      markRead(alert.id)
                      setIsOpen(false)
                    }}
                    className={`flex flex-col gap-0.5 border-b border-border px-4 py-2.5 transition-colors hover:bg-muted/50 ${
                      !alert.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className="text-xs font-medium text-foreground">
                      {alert.sectorName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {alert.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatRelative(alert.createdAt)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}
