'use client'

import { useState } from 'react'
import {
  Rows3,
  Route,
  CloudSun,
  Activity,
  BarChart3,
  FileText,
} from 'lucide-react'

export type SectorTab = 'blocs' | 'circuits' | 'topo' | 'meteo' | 'activite' | 'stats'

interface TabConfig {
  id: SectorTab
  label: string
  icon: React.ReactNode
  available: boolean
}

const TABS: TabConfig[] = [
  {
    id: 'blocs',
    label: 'Blocs',
    icon: <Rows3 className="h-3.5 w-3.5" />,
    available: true,
  },
  {
    id: 'circuits',
    label: 'Circuits',
    icon: <Route className="h-3.5 w-3.5" />,
    available: true,
  },
  {
    id: 'topo',
    label: 'Topo',
    icon: <FileText className="h-3.5 w-3.5" />,
    available: false,
  },
  {
    id: 'meteo',
    label: 'Météo',
    icon: <CloudSun className="h-3.5 w-3.5" />,
    available: true,
  },
  {
    id: 'activite',
    label: 'Activité',
    icon: <Activity className="h-3.5 w-3.5" />,
    available: true,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    available: false,
  },
]

interface SectorTabsProps {
  activeTab: SectorTab
  onTabChange: (tab: SectorTab) => void
}

/**
 * Horizontal scrollable tab bar for sector page (Story 13.1).
 *
 * Tabs that aren't yet implemented show a "coming soon" placeholder
 * and are progressively activated as later epics are delivered.
 */
export function SectorTabs({ activeTab, onTabChange }: SectorTabsProps) {
  return (
    <div className="mb-4 border-b border-border">
      <nav
        className="-mb-px flex gap-1 overflow-x-auto scrollbar-none"
        aria-label="Onglets secteur"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => tab.available && onTabChange(tab.id)}
              disabled={!tab.available}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : tab.available
                    ? 'border-transparent text-muted-foreground hover:text-foreground'
                    : 'border-transparent text-muted-foreground/40 cursor-not-allowed'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon}
              {tab.label}
              {!tab.available && (
                <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground/50">
                  Bientôt
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/**
 * Placeholder content for tabs not yet implemented.
 */
export function TabPlaceholder({ tabName }: { tabName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Route className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        {tabName} — Bientôt disponible
      </p>
      <p className="mt-1 text-xs text-muted-foreground/60">
        Cette section sera ajoutée dans une prochaine mise à jour.
      </p>
    </div>
  )
}

/**
 * Wrapper that manages tab state and renders the active tab content.
 */
export function SectorTabsContainer({
  blocsContent,
  circuitsContent,
  meteoContent,
  activityContent,
}: {
  blocsContent: React.ReactNode
  circuitsContent?: React.ReactNode
  meteoContent?: React.ReactNode
  activityContent?: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState<SectorTab>('blocs')

  return (
    <>
      <SectorTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'blocs' && blocsContent}
      {activeTab === 'circuits' && (circuitsContent ?? <TabPlaceholder tabName="Circuits" />)}
      {activeTab === 'topo' && <TabPlaceholder tabName="Topo" />}
      {activeTab === 'meteo' && (meteoContent ?? <TabPlaceholder tabName="Météo" />)}
      {activeTab === 'activite' && (activityContent ?? <TabPlaceholder tabName="Activité" />)}
      {activeTab === 'stats' && <TabPlaceholder tabName="Statistiques" />}
    </>
  )
}
