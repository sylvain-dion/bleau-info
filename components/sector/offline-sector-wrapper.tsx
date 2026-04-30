'use client'

import { WifiOff, Download, Clock } from 'lucide-react'
import { useOfflineSectorPage } from '@/lib/hooks/use-offline-sector-page'
import { SectorHeader } from './sector-header'
import { SectorTabsContainer } from './sector-tabs'
import { SectorEcoBanner } from './sector-eco-banner'
import { SectorCallsWidget } from './sector-calls-widget'
import { BoulderListView } from './boulder-list-view'
import { SectorCircuitsTab } from './sector-circuits-tab'
import { SectorWeatherTab } from './sector-weather-tab'
import { SectorActivityTab } from './sector-activity-tab'
import { SectorStatsTab } from './sector-stats-tab'
import type { SectorDetail } from '@/lib/data/boulder-service'
import type { BoulderListItem } from './boulder-list-card'

interface OfflineSectorWrapperProps {
  /** Server-rendered sector data (null when not available) */
  serverSector: SectorDetail
  /** Server-rendered boulders */
  serverBoulders: BoulderListItem[]
  sectorSlug: string
  sectorName: string
}

/**
 * Client wrapper for offline-first sector page rendering.
 *
 * Online: renders server-provided data directly.
 * Offline + cached: replaces with IndexedDB data + offline banner.
 * Offline + not cached: shows "not available offline" fallback.
 */
export function OfflineSectorWrapper({
  serverSector,
  serverBoulders,
  sectorSlug,
  sectorName,
}: OfflineSectorWrapperProps) {
  const { showOfflineFallback, offlineData, isLoading, downloadedAt } =
    useOfflineSectorPage(sectorSlug, sectorName)

  // Offline + not cached → fallback
  if (showOfflineFallback) {
    return <OfflineNotAvailable sectorName={sectorName} />
  }

  // Loading from IndexedDB
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Use offline data if available, otherwise server data
  const sector = offlineData?.sector ?? serverSector
  const boulders = offlineData?.boulders ?? serverBoulders

  const blocsContent = (
    <>
      {/* Offline banner */}
      {offlineData && downloadedAt && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            Mode hors-ligne · Données du{' '}
            {new Date(downloadedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      )}
      <BoulderListView boulders={boulders} sectorSlug={sectorSlug} />
    </>
  )

  return (
    <>
      <SectorHeader sector={sector} boulderIds={boulders.map((b) => b.id)} isOfflineReady={!!offlineData} />
      <SectorEcoBanner sectorSlug={sectorSlug} />
      <SectorCallsWidget sectorSlug={sectorSlug} sectorName={sector.name} />
      <SectorTabsContainer
        blocsContent={blocsContent}
        circuitsContent={
          <SectorCircuitsTab
            sectorName={sector.name}
            offlineCircuits={offlineData?.circuits}
          />
        }
        meteoContent={
          <SectorWeatherTab
            sectorName={sector.name}
            sectorLat={sector.centroid.latitude}
            sectorLng={sector.centroid.longitude}
            bouldersInSector={boulders.map((b) => ({ id: b.id, name: b.name }))}
            offlineWeather={
              offlineData
                ? {
                    forecast: offlineData.weatherForecast ?? null,
                    rainHistory: offlineData.rainHistory ?? null,
                    praticabilityScore: offlineData.praticabilityScore ?? null,
                    downloadedAt: offlineData.downloadedAt,
                  }
                : undefined
            }
          />
        }
        activityContent={
          <SectorActivityTab boulderIds={boulders.map((b) => b.id)} />
        }
        statsContent={
          <SectorStatsTab boulders={boulders} />
        }
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Fallback: sector not available offline
// ---------------------------------------------------------------------------

function OfflineNotAvailable({ sectorName }: { sectorName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-lg font-bold text-foreground">
        Secteur non disponible hors-ligne
      </h2>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        Le secteur {sectorName} n&apos;a pas été téléchargé. Connectez-vous à
        internet pour le consulter ou téléchargez le pack secteur.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Download className="h-4 w-4" />
        <span>Télécharger le pack dès que le réseau est disponible</span>
      </div>
    </div>
  )
}
