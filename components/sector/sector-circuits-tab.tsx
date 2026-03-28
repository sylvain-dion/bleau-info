'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Route,
  Hash,
  ArrowLeft,
  Map,
  CheckCircle2,
  Circle,
  ListChecks,
  Compass,
} from 'lucide-react'
import {
  getCircuitsForSector,
  type CircuitInfo,
} from '@/lib/data/mock-circuits'
import { getBoulderById, toSlug } from '@/lib/data/boulder-service'
import { CIRCUIT_COLORS, type CircuitColor } from '@/lib/data/mock-boulders'
import { useTickStore } from '@/stores/tick-store'
import { useAuthStore } from '@/stores/auth-store'
import { useGuidedModeStore } from '@/stores/guided-mode-store'
import { todayISO } from '@/lib/validations/tick'
import { toast } from 'sonner'

const CIRCUIT_LABELS: Record<CircuitColor, string> = {
  jaune: 'Jaune',
  bleu: 'Bleu',
  rouge: 'Rouge',
  blanc: 'Blanc',
  orange: 'Orange',
  noir: 'Noir',
}

interface SectorCircuitsTabProps {
  sectorName: string
}

/**
 * Circuits tab content with list → detail navigation.
 *
 * List view: shows all circuits in the sector.
 * Detail view: shows ordered boulder list with completion + log button.
 */
export function SectorCircuitsTab({ sectorName }: SectorCircuitsTabProps) {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | null>(null)

  const circuits = useMemo(
    () => getCircuitsForSector(sectorName),
    [sectorName]
  )

  const selected = selectedCircuitId
    ? circuits.find((c) => c.id === selectedCircuitId) ?? null
    : null

  if (selected) {
    return (
      <CircuitDetailView
        circuit={selected}
        onBack={() => setSelectedCircuitId(null)}
      />
    )
  }

  return <CircuitListView circuits={circuits} onSelect={setSelectedCircuitId} />
}

// ---------------------------------------------------------------------------
// Circuit list view
// ---------------------------------------------------------------------------

function CircuitListView({
  circuits,
  onSelect,
}: {
  circuits: CircuitInfo[]
  onSelect: (id: string) => void
}) {
  if (circuits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Route className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Aucun circuit dans ce secteur
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {circuits.length} circuit{circuits.length > 1 ? 's' : ''}
      </p>

      {circuits.map((circuit) => (
        <button
          key={circuit.id}
          type="button"
          onClick={() => onSelect(circuit.id)}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: circuit.hexColor + '20' }}
          >
            <div
              className="h-5 w-5 rounded-full"
              style={{
                backgroundColor: circuit.hexColor,
                border: circuit.color === 'blanc' ? '1px solid #d4d4d8' : undefined,
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground">
              Circuit {CIRCUIT_LABELS[circuit.color]}
            </span>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {circuit.boulderCount} blocs
              </span>
              <span>
                {circuit.gradeRange.min} → {circuit.gradeRange.max}
              </span>
            </div>
          </div>
          <span className="text-muted-foreground">›</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Circuit detail view (inside tab)
// ---------------------------------------------------------------------------

function CircuitDetailView({
  circuit,
  onBack,
}: {
  circuit: CircuitInfo
  onBack: () => void
}) {
  const router = useRouter()
  const sectorSlug = toSlug(circuit.sector)
  const startGuide = useGuidedModeStore((s) => s.startGuide)
  const addTick = useTickStore((s) => s.addTick)
  const ticks = useTickStore((s) => s.ticks)
  const { user } = useAuthStore()
  const tickedIds = useMemo(
    () => new Set(ticks.map((t) => t.boulderId)),
    [ticks]
  )

  const boulders = useMemo(
    () => circuit.boulderIds.map((id) => getBoulderById(id)).filter(Boolean),
    [circuit.boulderIds]
  )

  const unticked = boulders.filter((b) => b && !tickedIds.has(b.id))

  function handleLogAll() {
    if (!user || unticked.length === 0) return
    const today = todayISO()
    for (const boulder of unticked) {
      if (!boulder) continue
      addTick({
        userId: user.id,
        boulderId: boulder.id,
        boulderName: boulder.name,
        boulderGrade: boulder.grade,
        tickStyle: 'flash',
        tickDate: today,
        personalNote: '',
        perceivedGrade: null,
      })
    }
    toast.success(`${unticked.length} croix enregistrées`, {
      description: `Circuit ${CIRCUIT_LABELS[circuit.color]} complété`,
      duration: 4000,
    })
  }

  const completedCount = boulders.filter((b) => b && tickedIds.has(b.id)).length
  const progressPercent =
    boulders.length > 0 ? Math.round((completedCount / boulders.length) * 100) : 0

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tous les circuits
      </button>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: circuit.hexColor + '20' }}
        >
          <div
            className="h-6 w-6 rounded-full"
            style={{
              backgroundColor: circuit.hexColor,
              border: circuit.color === 'blanc' ? '2px solid #d4d4d8' : undefined,
            }}
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Circuit {CIRCUIT_LABELS[circuit.color]}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{circuit.boulderCount} blocs</span>
            <span>
              {circuit.gradeRange.min} → {circuit.gradeRange.max}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {completedCount > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-bold text-primary">
              {completedCount}/{boulders.length} — {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            // Find first uncompleted boulder, or start from beginning
            const startIdx = circuit.boulderIds.findIndex((id) => !tickedIds.has(id))
            startGuide(circuit.id, circuit.color, circuit.boulderIds, startIdx >= 0 ? startIdx : 0)
            router.push('/')
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: circuit.hexColor }}
        >
          <Compass className="h-3.5 w-3.5" />
          Mode guidé
        </button>
        <Link
          href={`/?circuit=${circuit.color}&sector=${sectorSlug}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Map className="h-3.5 w-3.5" />
          Carte
        </Link>
        <button
          type="button"
          onClick={handleLogAll}
          disabled={!user || unticked.length === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {unticked.length === 0 ? 'Tout logué' : `Loguer tout (${unticked.length})`}
        </button>
      </div>

      {/* Boulder list */}
      <div className="space-y-1">
        {boulders.map((boulder, index) => {
          if (!boulder) return null
          const isCompleted = tickedIds.has(boulder.id)

          return (
            <Link
              key={boulder.id}
              href={`/blocs/${boulder.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: circuit.hexColor }}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {boulder.name}
                </p>
                <p className="text-xs text-muted-foreground">{boulder.grade}</p>
              </div>
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
