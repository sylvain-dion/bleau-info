import { describe, it, expect } from 'vitest'
import {
  filterTicks,
  sortTicks,
  selectTicks,
  recentTicks,
  uniqueBoulderCount,
  groupTicksByCircuit,
  orphanTicks,
} from '@/lib/ascents-hub'
import type { Tick, TickStyle } from '@/lib/validations/tick'
import type { CircuitInfo } from '@/lib/data/mock-circuits'

function makeTick(
  overrides: Partial<Tick> & {
    tickDate: string
    boulderGrade: string
    boulderId?: string
    boulderName?: string
    tickStyle?: TickStyle
  },
): Tick {
  const {
    tickDate,
    boulderGrade,
    boulderId = 'b1',
    boulderName = 'La Marie-Rose',
    tickStyle = 'flash',
  } = overrides
  return {
    id: overrides.id ?? `${boulderId}-${tickDate}`,
    userId: 'u1',
    boulderId,
    boulderName,
    boulderGrade,
    tickStyle,
    tickDate,
    personalNote: '',
    perceivedGrade: null,
    syncStatus: 'local',
    createdAt: overrides.createdAt ?? `${tickDate}T12:00:00Z`,
  }
}

function makeCircuit(overrides: Partial<CircuitInfo> & { id: string }): CircuitInfo {
  return {
    id: overrides.id,
    color: overrides.color ?? 'orange',
    sector: overrides.sector ?? 'Cuvier',
    hexColor: overrides.hexColor ?? '#ff6f00',
    boulderCount: overrides.boulderCount ?? overrides.boulderIds?.length ?? 0,
    gradeRange: overrides.gradeRange ?? { min: '4a', max: '6a' },
    boulderIds: overrides.boulderIds ?? [],
  }
}

// ---------------------------------------------------------------------------
// filterTicks
// ---------------------------------------------------------------------------

describe('filterTicks', () => {
  const ticks: Tick[] = [
    makeTick({
      tickDate: '2026-01-10',
      boulderGrade: '4a',
      boulderId: 'b1',
      boulderName: 'La Marie-Rose',
      tickStyle: 'flash',
    }),
    makeTick({
      tickDate: '2026-02-10',
      boulderGrade: '6b',
      boulderId: 'b2',
      boulderName: 'L\u2019Insoutenable',
      tickStyle: 'travaille',
    }),
    makeTick({
      tickDate: '2026-03-10',
      boulderGrade: '7a',
      boulderId: 'b3',
      boulderName: 'Karma',
      tickStyle: 'a_vue',
    }),
  ]

  it('returns the input unchanged with empty filters', () => {
    expect(filterTicks(ticks, {}).map((t) => t.id)).toEqual(
      ticks.map((t) => t.id),
    )
  })

  it('matches on the boulder name (case-insensitive, accent-insensitive)', () => {
    const out = filterTicks(ticks, { search: 'INSOUTENABLE' })
    expect(out).toHaveLength(1)
    expect(out[0].boulderId).toBe('b2')
  })

  it('strips diacritics from both sides of the search', () => {
    const out = filterTicks(ticks, { search: 'mariE-rosE' })
    expect(out).toHaveLength(1)
    expect(out[0].boulderId).toBe('b1')
  })

  it('filters by style', () => {
    expect(filterTicks(ticks, { styles: ['flash'] }).map((t) => t.id)).toEqual([
      ticks[0].id,
    ])
    expect(
      filterTicks(ticks, { styles: ['flash', 'travaille'] }).map((t) => t.id),
    ).toEqual([ticks[0].id, ticks[1].id])
  })

  it('filters by min grade (inclusive)', () => {
    const out = filterTicks(ticks, { minGrade: '6a' })
    expect(out.map((t) => t.boulderGrade)).toEqual(['6b', '7a'])
  })

  it('filters by max grade (inclusive)', () => {
    const out = filterTicks(ticks, { maxGrade: '6b' })
    expect(out.map((t) => t.boulderGrade)).toEqual(['4a', '6b'])
  })

  it('filters by a min/max range', () => {
    const out = filterTicks(ticks, { minGrade: '5a', maxGrade: '6c' })
    expect(out.map((t) => t.boulderGrade)).toEqual(['6b'])
  })

  it('treats unknown grade boundaries as no-op', () => {
    expect(filterTicks(ticks, { minGrade: 'xx' })).toHaveLength(3)
    expect(filterTicks(ticks, { maxGrade: '' })).toHaveLength(3)
    expect(filterTicks(ticks, { minGrade: null, maxGrade: null })).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// sortTicks
// ---------------------------------------------------------------------------

describe('sortTicks', () => {
  const ticks: Tick[] = [
    makeTick({
      tickDate: '2026-01-10',
      boulderGrade: '4a',
      boulderId: 'b1',
      boulderName: 'Bravo',
    }),
    makeTick({
      tickDate: '2026-03-10',
      boulderGrade: '6a',
      boulderId: 'b2',
      boulderName: 'Alpha',
    }),
    makeTick({
      tickDate: '2026-02-10',
      boulderGrade: '5a',
      boulderId: 'b3',
      boulderName: 'Charlie',
    }),
  ]

  it('sorts by date descending (default)', () => {
    expect(sortTicks(ticks, 'date-desc').map((t) => t.tickDate)).toEqual([
      '2026-03-10',
      '2026-02-10',
      '2026-01-10',
    ])
  })

  it('sorts by date ascending', () => {
    expect(sortTicks(ticks, 'date-asc').map((t) => t.tickDate)).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-10',
    ])
  })

  it('sorts by grade descending', () => {
    expect(sortTicks(ticks, 'grade-desc').map((t) => t.boulderGrade)).toEqual([
      '6a',
      '5a',
      '4a',
    ])
  })

  it('sorts by grade ascending', () => {
    expect(sortTicks(ticks, 'grade-asc').map((t) => t.boulderGrade)).toEqual([
      '4a',
      '5a',
      '6a',
    ])
  })

  it('sorts by name (French collation, case-insensitive)', () => {
    expect(sortTicks(ticks, 'name-asc').map((t) => t.boulderName)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ])
  })

  it('breaks date ties on createdAt (newest first)', () => {
    const tied = [
      makeTick({
        tickDate: '2026-01-10',
        boulderGrade: '4a',
        id: 'late',
        createdAt: '2026-01-10T18:00:00Z',
      }),
      makeTick({
        tickDate: '2026-01-10',
        boulderGrade: '4a',
        id: 'early',
        createdAt: '2026-01-10T08:00:00Z',
      }),
    ]
    expect(sortTicks(tied, 'date-desc').map((t) => t.id)).toEqual([
      'late',
      'early',
    ])
  })

  it('does not mutate the input', () => {
    const before = [...ticks]
    sortTicks(ticks, 'grade-desc')
    expect(ticks).toEqual(before)
  })
})

// ---------------------------------------------------------------------------
// selectTicks (filter + sort combo)
// ---------------------------------------------------------------------------

describe('selectTicks', () => {
  it('applies the filter before sorting', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '7a', boulderName: 'Karma' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '5a', boulderName: 'Alpha' }),
      makeTick({ tickDate: '2026-03-01', boulderGrade: '6a', boulderName: 'Beta' }),
    ]
    const out = selectTicks(ticks, { minGrade: '6a' }, 'grade-asc')
    expect(out.map((t) => t.boulderGrade)).toEqual(['6a', '7a'])
  })
})

// ---------------------------------------------------------------------------
// recentTicks
// ---------------------------------------------------------------------------

describe('recentTicks', () => {
  it('returns the latest N ticks by date', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '4a', id: 'a' }),
      makeTick({ tickDate: '2026-03-01', boulderGrade: '5a', id: 'b' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '6a', id: 'c' }),
      makeTick({ tickDate: '2026-04-01', boulderGrade: '7a', id: 'd' }),
    ]
    expect(recentTicks(ticks, 2).map((t) => t.id)).toEqual(['d', 'b'])
  })

  it('returns an empty array for non-positive limits', () => {
    const ticks = [makeTick({ tickDate: '2026-01-01', boulderGrade: '4a' })]
    expect(recentTicks(ticks, 0)).toEqual([])
    expect(recentTicks(ticks, -1)).toEqual([])
  })

  it('returns all ticks when limit exceeds list length', () => {
    const ticks = [makeTick({ tickDate: '2026-01-01', boulderGrade: '4a' })]
    expect(recentTicks(ticks, 5)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// uniqueBoulderCount
// ---------------------------------------------------------------------------

describe('uniqueBoulderCount', () => {
  it('returns 0 for an empty list', () => {
    expect(uniqueBoulderCount([])).toBe(0)
  })

  it('counts distinct boulder ids', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '4a', boulderId: 'b1' }),
      makeTick({ tickDate: '2026-01-02', boulderGrade: '4a', boulderId: 'b1' }),
      makeTick({ tickDate: '2026-01-03', boulderGrade: '5a', boulderId: 'b2' }),
    ]
    expect(uniqueBoulderCount(ticks)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// groupTicksByCircuit
// ---------------------------------------------------------------------------

describe('groupTicksByCircuit', () => {
  const circuitA = makeCircuit({
    id: 'A',
    sector: 'Cuvier',
    boulderIds: ['a1', 'a2', 'a3'],
  })
  const circuitB = makeCircuit({
    id: 'B',
    sector: 'Bas Cuvier',
    boulderIds: ['b1', 'b2'],
  })

  it('returns an empty array when no circuit has a tick', () => {
    expect(groupTicksByCircuit([circuitA, circuitB], [], new Set())).toEqual([])
  })

  it('groups ticks under the matching circuit', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '5a', boulderId: 'a1' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '5a', boulderId: 'a2' }),
      makeTick({ tickDate: '2026-03-01', boulderGrade: '5a', boulderId: 'b1' }),
    ]
    const groups = groupTicksByCircuit(
      [circuitA, circuitB],
      ticks,
      new Set(['a1', 'a2', 'b1']),
    )
    const ids = groups.map((g) => g.circuit.id)
    expect(ids).toContain('A')
    expect(ids).toContain('B')
    expect(groups.find((g) => g.circuit.id === 'A')?.ticks).toHaveLength(2)
    expect(groups.find((g) => g.circuit.id === 'B')?.ticks).toHaveLength(1)
  })

  it('sorts circuits with completed first, then by progress descending', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '5a', boulderId: 'a1' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '5a', boulderId: 'b1' }),
      makeTick({ tickDate: '2026-02-02', boulderGrade: '5a', boulderId: 'b2' }),
    ]
    const groups = groupTicksByCircuit(
      [circuitA, circuitB],
      ticks,
      new Set(['a1', 'b1', 'b2']),
    )
    expect(groups[0].circuit.id).toBe('B') // 100% complete
    expect(groups[1].circuit.id).toBe('A') // 33% complete
  })

  it('skips circuits the user has not touched', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '5a', boulderId: 'a1' }),
    ]
    const groups = groupTicksByCircuit(
      [circuitA, circuitB],
      ticks,
      new Set(['a1']),
    )
    expect(groups.map((g) => g.circuit.id)).toEqual(['A'])
  })

  it('sorts the ticks inside each group by date descending', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '5a', boulderId: 'a1', id: 'old' }),
      makeTick({ tickDate: '2026-04-01', boulderGrade: '5a', boulderId: 'a2', id: 'new' }),
    ]
    const groups = groupTicksByCircuit([circuitA], ticks, new Set(['a1', 'a2']))
    expect(groups[0].ticks.map((t) => t.id)).toEqual(['new', 'old'])
  })
})

// ---------------------------------------------------------------------------
// orphanTicks
// ---------------------------------------------------------------------------

describe('orphanTicks', () => {
  const circuit = makeCircuit({ id: 'A', boulderIds: ['a1', 'a2'] })

  it('returns ticks that do not belong to any circuit', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '4a', boulderId: 'a1' }),
      makeTick({ tickDate: '2026-02-01', boulderGrade: '4a', boulderId: 'orphan' }),
    ]
    const out = orphanTicks([circuit], ticks)
    expect(out).toHaveLength(1)
    expect(out[0].boulderId).toBe('orphan')
  })

  it('returns all ticks when the circuit list is empty', () => {
    const ticks = [
      makeTick({ tickDate: '2026-01-01', boulderGrade: '4a', boulderId: 'b1' }),
    ]
    expect(orphanTicks([], ticks)).toHaveLength(1)
  })
})
