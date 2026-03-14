import { describe, it, expect } from 'vitest'
import {
  scalePointsToViewBox,
  actionsToTopoDrawing,
  type DrawAction,
} from '@/lib/topo/topo-export'

describe('scalePointsToViewBox', () => {
  it('scales points from canvas coordinates to viewBox', () => {
    // Canvas 400×300, viewBox 800×600 → 2× scale
    const result = scalePointsToViewBox([200, 150], 400, 300)
    expect(result).toEqual([400, 300])
  })

  it('handles non-uniform scaling', () => {
    // Canvas 1200×800, viewBox 800×600
    const result = scalePointsToViewBox([600, 400], 1200, 800)
    expect(result).toEqual([400, 300])
  })

  it('rounds to integers', () => {
    const result = scalePointsToViewBox([100, 100], 300, 300)
    // 100 * (800/300) = 266.67 → 267
    // 100 * (600/300) = 200
    expect(result[0]).toBe(267)
    expect(result[1]).toBe(200)
  })

  it('handles multiple points', () => {
    const result = scalePointsToViewBox([0, 0, 200, 150, 400, 300], 400, 300)
    expect(result).toEqual([0, 0, 400, 300, 800, 600])
  })
})

describe('actionsToTopoDrawing', () => {
  const canvasWidth = 800
  const canvasHeight = 600

  it('returns empty elements for no actions', () => {
    const result = actionsToTopoDrawing([], canvasWidth, canvasHeight)
    expect(result.viewBox).toBe('0 0 800 600')
    expect(result.elements).toEqual([])
  })

  it('converts a line action to a path element', () => {
    const actions: DrawAction[] = [
      { type: 'line', points: [100, 500, 200, 400, 300, 300, 400, 200] },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    expect(result.elements).toHaveLength(1)
    expect(result.elements[0].type).toBe('path')
    if (result.elements[0].type === 'path') {
      expect(result.elements[0].d).toMatch(/^M/)
      expect(result.elements[0].label).toBe('route')
    }
  })

  it('converts multiple line actions to multiple path elements', () => {
    const actions: DrawAction[] = [
      { type: 'line', points: [100, 500, 200, 400, 300, 300, 400, 200] },
      { type: 'line', points: [500, 500, 600, 400, 700, 300] },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    const paths = result.elements.filter((e) => e.type === 'path')
    expect(paths).toHaveLength(2)
  })

  it('ignores line actions with too few points', () => {
    const actions: DrawAction[] = [
      { type: 'line', points: [100, 200] }, // Only 1 point
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    expect(result.elements).toHaveLength(0)
  })

  it('converts start action to circle element', () => {
    const actions: DrawAction[] = [
      { type: 'start', x: 400, y: 300 },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    expect(result.elements).toHaveLength(1)
    expect(result.elements[0].type).toBe('circle')
    if (result.elements[0].type === 'circle') {
      expect(result.elements[0].cx).toBe(400)
      expect(result.elements[0].cy).toBe(300)
      expect(result.elements[0].r).toBe(14)
      expect(result.elements[0].label).toBe('start')
    }
  })

  it('uses last start action when multiple exist', () => {
    const actions: DrawAction[] = [
      { type: 'start', x: 100, y: 100 },
      { type: 'start', x: 400, y: 500 },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    const circles = result.elements.filter((e) => e.type === 'circle')
    expect(circles).toHaveLength(1)
    if (circles[0].type === 'circle') {
      expect(circles[0].cx).toBe(400)
      expect(circles[0].cy).toBe(500)
    }
  })

  it('converts end action to polygon element', () => {
    const actions: DrawAction[] = [
      { type: 'end', x: 400, y: 100 },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)
    expect(result.elements).toHaveLength(1)
    expect(result.elements[0].type).toBe('polygon')
    if (result.elements[0].type === 'polygon') {
      expect(result.elements[0].label).toBe('end')
      // Should have 3 vertices
      expect(result.elements[0].points.split(' ')).toHaveLength(3)
    }
  })

  it('handles full drawing with all action types', () => {
    const actions: DrawAction[] = [
      { type: 'start', x: 200, y: 500 },
      { type: 'line', points: [200, 500, 300, 400, 400, 300, 500, 200] },
      { type: 'end', x: 500, y: 100 },
    ]
    const result = actionsToTopoDrawing(actions, canvasWidth, canvasHeight)

    const paths = result.elements.filter((e) => e.type === 'path')
    const circles = result.elements.filter((e) => e.type === 'circle')
    const polygons = result.elements.filter((e) => e.type === 'polygon')

    expect(paths).toHaveLength(1)
    expect(circles).toHaveLength(1)
    expect(polygons).toHaveLength(1)
  })

  it('scales coordinates when canvas differs from viewBox', () => {
    // Canvas 400×300 = half the viewBox 800×600
    const actions: DrawAction[] = [
      { type: 'start', x: 200, y: 150 },
    ]
    const result = actionsToTopoDrawing(actions, 400, 300)
    if (result.elements[0].type === 'circle') {
      expect(result.elements[0].cx).toBe(400)
      expect(result.elements[0].cy).toBe(300)
    }
  })
})
