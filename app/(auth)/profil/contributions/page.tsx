'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Mountain,
  Video,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useBoulderDraftStore } from '@/stores/boulder-draft-store'
import { useVideoSubmissionStore } from '@/stores/video-submission-store'
import { countContributions } from '@/lib/contributions-hub'
import { ContributionsBouldersTab } from '@/components/profile/contributions-boulders-tab'
import { ContributionsMediaTab } from '@/components/profile/contributions-media-tab'

type TabKey = 'boulders' | 'media'

const TABS: ReadonlyArray<{
  key: TabKey
  label: string
  icon: typeof Mountain
}> = [
  { key: 'boulders', label: 'Blocs', icon: Mountain },
  { key: 'media', label: 'Médias', icon: Video },
]

const VALID_TABS = new Set<TabKey>(['boulders', 'media'])

function isTabKey(value: string | null): value is TabKey {
  return value !== null && VALID_TABS.has(value as TabKey)
}

/**
 * /profil/contributions — Hub regroupant les créations de blocs et les
 * vidéos soumises par l'utilisateur (Story 5.8).
 *
 * Deux onglets sur un même écran avec un header global affichant les
 * compteurs de synthèse (en ligne / en attente). L'onglet actif est
 * synchronisé avec le query param `?tab=`.
 */
export default function ContributionsPage() {
  return (
    <Suspense fallback={<HubFallback />}>
      <ContributionsHub />
    </Suspense>
  )
}

function ContributionsHub() {
  const { user, isLoading } = useAuthStore()
  const drafts = useBoulderDraftStore((s) => s.drafts)
  const allVideos = useVideoSubmissionStore((s) => s.submissions)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: TabKey = isTabKey(tabParam) ? tabParam : 'boulders'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  // Keep state and URL in sync when the param changes from outside
  useEffect(() => {
    if (isTabKey(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [tabParam, activeTab])

  const userVideos = useMemo(
    () => (user ? allVideos.filter((v) => v.userId === user.id) : []),
    [allVideos, user],
  )
  const counts = useMemo(
    () => countContributions(drafts, userVideos),
    [drafts, userVideos],
  )

  if (isLoading) return <HubFallback />
  if (!user) return null

  function handleTabChange(next: TabKey) {
    setActiveTab(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', next)
    router.replace(`/profil/contributions?${params.toString()}`, {
      scroll: false,
    })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <header className="mb-5">
        <Link
          href="/profil"
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour au profil
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Mes contributions
            </h1>
            <p className="text-sm text-muted-foreground">
              Vos créations de blocs et vidéos soumises
            </p>
          </div>
        </div>
      </header>

      {/* Counters */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <CounterCard
          label="En ligne"
          value={counts.onlineCount}
          tone="emerald"
        />
        <CounterCard
          label="En attente"
          value={counts.pendingCount}
          tone="amber"
        />
      </div>

      {/* Tab navigation */}
      <nav
        className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1"
        role="tablist"
        aria-label="Onglets contributions"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          const tabCount =
            tab.key === 'boulders' ? counts.totalBoulders : counts.totalMedia
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tab-panel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => handleTabChange(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition-colors min-touch ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                {tabCount}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Tab panels */}
      {activeTab === 'boulders' && (
        <div
          id="tab-panel-boulders"
          role="tabpanel"
          aria-labelledby="tab-boulders"
        >
          <ContributionsBouldersTab />
        </div>
      )}
      {activeTab === 'media' && (
        <div id="tab-panel-media" role="tabpanel" aria-labelledby="tab-media">
          <ContributionsMediaTab />
        </div>
      )}
    </div>
  )
}

function CounterCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber'
}) {
  const className =
    tone === 'emerald'
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
      : 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function HubFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}
