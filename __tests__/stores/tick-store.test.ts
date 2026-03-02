import { describe, it, expect, beforeEach } from 'vitest'
import { useTickStore } from '@/stores/tick-store'
import { formatTickStyle } from '@/stores/tick-store'
import type { TickStyle } from '@/lib/validations/tick'

describe('tick-store', () => {
  beforeEach(() => {
    useTickStore.setState({ ticks: [] })
  })

  it('should start with empty ticks', () => {
    expect(useTickStore.getState().ticks).toHaveLength(0)
  })

  it('should add a tick and return its id', () => {
    const id = useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'La Marie-Rose',
      boulderGrade: '6a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: 'Super session',
    })

    expect(id).toBeTruthy()
    const ticks = useTickStore.getState().ticks
    expect(ticks).toHaveLength(1)
    expect(ticks[0].boulderId).toBe('boulder-1')
    expect(ticks[0].tickStyle).toBe('flash')
    expect(ticks[0].personalNote).toBe('Super session')
    expect(ticks[0].createdAt).toBeTruthy()
  })

  it('should prepend new ticks (newest first)', () => {
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'a_vue',
      tickDate: '2026-02-28',
      personalNote: '',
    })
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-2',
      boulderName: 'Bloc B',
      boulderGrade: '6b',
      tickStyle: 'travaille',
      tickDate: '2026-03-01',
      personalNote: '',
    })

    const ticks = useTickStore.getState().ticks
    expect(ticks).toHaveLength(2)
    expect(ticks[0].boulderName).toBe('Bloc B') // newest first
    expect(ticks[1].boulderName).toBe('Bloc A')
  })

  it('should remove a tick by id', () => {
    const id = useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: '',
    })

    useTickStore.getState().removeTick(id)
    expect(useTickStore.getState().ticks).toHaveLength(0)
  })

  it('should not fail when removing non-existent tick', () => {
    useTickStore.getState().removeTick('non-existent')
    expect(useTickStore.getState().ticks).toHaveLength(0)
  })

  it('should get ticks for a specific boulder', () => {
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: '',
    })
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-2',
      boulderName: 'Bloc B',
      boulderGrade: '6b',
      tickStyle: 'a_vue',
      tickDate: '2026-03-01',
      personalNote: '',
    })

    const boulder1Ticks = useTickStore.getState().getTicksForBoulder('boulder-1')
    expect(boulder1Ticks).toHaveLength(1)
    expect(boulder1Ticks[0].boulderName).toBe('Bloc A')
  })

  it('should check if boulder is completed', () => {
    expect(useTickStore.getState().isBoulderCompleted('boulder-1')).toBe(false)

    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: '',
    })

    expect(useTickStore.getState().isBoulderCompleted('boulder-1')).toBe(true)
    expect(useTickStore.getState().isBoulderCompleted('boulder-2')).toBe(false)
  })

  it('should return completed boulder ids as a Set', () => {
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: '',
    })
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-3',
      boulderName: 'Bloc C',
      boulderGrade: '7a',
      tickStyle: 'travaille',
      tickDate: '2026-03-01',
      personalNote: '',
    })

    const ids = useTickStore.getState().getCompletedBoulderIds()
    expect(ids).toBeInstanceOf(Set)
    expect(ids.size).toBe(2)
    expect(ids.has('boulder-1')).toBe(true)
    expect(ids.has('boulder-3')).toBe(true)
  })

  it('should deduplicate completed boulder ids when multiple ticks exist', () => {
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'flash',
      tickDate: '2026-03-01',
      personalNote: '',
    })
    useTickStore.getState().addTick({
      userId: 'user-1',
      boulderId: 'boulder-1',
      boulderName: 'Bloc A',
      boulderGrade: '5a',
      tickStyle: 'a_vue',
      tickDate: '2026-03-02',
      personalNote: 'Second attempt',
    })

    const ids = useTickStore.getState().getCompletedBoulderIds()
    expect(ids.size).toBe(1) // deduplicated
    expect(useTickStore.getState().ticks).toHaveLength(2) // both ticks exist
  })
})

describe('formatTickStyle', () => {
  it('should format tick styles in French', () => {
    expect(formatTickStyle('flash')).toBe('Flash')
    expect(formatTickStyle('a_vue')).toBe('À vue')
    expect(formatTickStyle('travaille')).toBe('Travaillé')
  })
})
