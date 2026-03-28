/**
 * Weather alerts preferences + notification history.
 *
 * Users opt-in to receive notifications when favorite sectors
 * meet their configured weather criteria.
 * In-app notifications for explore mode (Web Push later).
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WeatherCriteria {
  /** Minimum acceptable temperature °C */
  tempMin: number
  /** Maximum acceptable temperature °C */
  tempMax: number
  /** Maximum acceptable wind speed km/h */
  windMax: number
  /** Minimum days without rain */
  dryDaysMin: number
}

export interface WeatherAlert {
  id: string
  sectorName: string
  sectorSlug: string
  message: string
  /** ISO timestamp */
  createdAt: string
  read: boolean
}

interface WeatherAlertsState {
  /** Whether the user has opted in to weather alerts */
  enabled: boolean
  /** User's weather criteria */
  criteria: WeatherCriteria
  /** Sector slugs the user wants alerts for (from favorites) */
  watchedSectors: string[]
  /** Alert history */
  alerts: WeatherAlert[]
  /** Track last alert per sector per day to enforce 1/day limit */
  lastAlertDates: Record<string, string>

  /** Toggle opt-in */
  setEnabled: (enabled: boolean) => void
  /** Update criteria */
  setCriteria: (criteria: Partial<WeatherCriteria>) => void
  /** Add/remove watched sectors */
  addWatchedSector: (slug: string) => void
  removeWatchedSector: (slug: string) => void
  /** Add an alert (respects 1/day/sector limit) */
  addAlert: (sectorName: string, sectorSlug: string, message: string) => boolean
  /** Mark alert as read */
  markRead: (id: string) => void
  /** Mark all as read */
  markAllRead: () => void
  /** Get unread count */
  getUnreadCount: () => number
}

const DEFAULT_CRITERIA: WeatherCriteria = {
  tempMin: 5,
  tempMax: 35,
  windMax: 30,
  dryDaysMin: 2,
}

function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export const useWeatherAlertsStore = create<WeatherAlertsState>()(
  persist(
    (set, get) => ({
      enabled: false,
      criteria: DEFAULT_CRITERIA,
      watchedSectors: [],
      alerts: [],
      lastAlertDates: {},

      setEnabled: (enabled) => set({ enabled }),

      setCriteria: (partial) =>
        set((state) => ({
          criteria: { ...state.criteria, ...partial },
        })),

      addWatchedSector: (slug) =>
        set((state) => ({
          watchedSectors: state.watchedSectors.includes(slug)
            ? state.watchedSectors
            : [...state.watchedSectors, slug],
        })),

      removeWatchedSector: (slug) =>
        set((state) => ({
          watchedSectors: state.watchedSectors.filter((s) => s !== slug),
        })),

      addAlert: (sectorName, sectorSlug, message) => {
        const state = get()
        if (!state.enabled) return false

        // 1/day/sector limit
        const today = todayKey()
        const lastDate = state.lastAlertDates[sectorSlug]
        if (lastDate === today) return false

        const alert: WeatherAlert = {
          id: generateId(),
          sectorName,
          sectorSlug,
          message,
          createdAt: new Date().toISOString(),
          read: false,
        }

        set((prev) => ({
          alerts: [alert, ...prev.alerts].slice(0, 50), // Keep last 50
          lastAlertDates: { ...prev.lastAlertDates, [sectorSlug]: today },
        }))

        return true
      },

      markRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, read: true } : a
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          alerts: state.alerts.map((a) => ({ ...a, read: true })),
        })),

      getUnreadCount: () =>
        get().alerts.filter((a) => !a.read).length,
    }),
    { name: 'bleau-weather-alerts' }
  )
)
