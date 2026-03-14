/**
 * Converts editor draw actions into the TopoDrawing format
 * compatible with the existing TopoViewer component.
 */

import type { TopoDrawing, TopoElement } from '@/lib/data/mock-topos'
import {
  simplifyPoints,
  pointsToSvgPath,
  createArrowPoints,
  getLastSegmentAngle,
} from './smooth-path'

/** Standard viewBox for all topo drawings */
const VIEWBOX_WIDTH = 800
const VIEWBOX_HEIGHT = 600

/** Default circle radius for start marker (in viewBox units) */
const START_MARKER_RADIUS = 14

/** Default arrow size for end marker (in viewBox units) */
const END_MARKER_SIZE = 10

/** A completed drawing action from the editor */
export type DrawAction =
  | { type: 'line'; points: number[] }
  | { type: 'start'; x: number; y: number }
  | { type: 'end'; x: number; y: number }

/**
 * Scale a flat point array from canvas pixel coordinates
 * to viewBox coordinates (0 0 800 600).
 */
export function scalePointsToViewBox(
  points: number[],
  canvasWidth: number,
  canvasHeight: number
): number[] {
  const scaleX = VIEWBOX_WIDTH / canvasWidth
  const scaleY = VIEWBOX_HEIGHT / canvasHeight
  const scaled: number[] = []

  for (let i = 0; i < points.length; i += 2) {
    scaled.push(
      Math.round(points[i] * scaleX),
      Math.round(points[i + 1] * scaleY)
    )
  }

  return scaled
}

/**
 * Convert editor draw actions to a TopoDrawing.
 *
 * - Line actions are simplified, smoothed, and converted to SVG paths
 * - Start action becomes a circle element
 * - End action becomes a polygon (arrow) element
 * - Coordinates are scaled from canvas pixels to viewBox (0 0 800 600)
 */
export function actionsToTopoDrawing(
  actions: DrawAction[],
  canvasWidth: number,
  canvasHeight: number
): TopoDrawing {
  const elements: TopoElement[] = []

  // Process line actions first (route paths)
  for (const action of actions) {
    if (action.type !== 'line') continue

    const simplified = simplifyPoints(action.points)
    if (simplified.length < 4) continue

    const scaled = scalePointsToViewBox(simplified, canvasWidth, canvasHeight)
    const d = pointsToSvgPath(scaled)

    if (d) {
      elements.push({ type: 'path', d, label: 'route' })
    }
  }

  // Process start marker
  const startAction = findLastAction(actions, 'start')
  if (startAction && startAction.type === 'start') {
    const scaleX = VIEWBOX_WIDTH / canvasWidth
    const scaleY = VIEWBOX_HEIGHT / canvasHeight
    elements.push({
      type: 'circle',
      cx: Math.round(startAction.x * scaleX),
      cy: Math.round(startAction.y * scaleY),
      r: START_MARKER_RADIUS,
      label: 'start',
    })
  }

  // Process end marker
  const endAction = findLastAction(actions, 'end')
  if (endAction && endAction.type === 'end') {
    const scaleX = VIEWBOX_WIDTH / canvasWidth
    const scaleY = VIEWBOX_HEIGHT / canvasHeight
    const cx = Math.round(endAction.x * scaleX)
    const cy = Math.round(endAction.y * scaleY)

    // Try to get direction from the last route line
    const lastLine = findLastAction(actions, 'line')
    const angle = lastLine && lastLine.type === 'line'
      ? getLastSegmentAngle(
          scalePointsToViewBox(lastLine.points, canvasWidth, canvasHeight)
        )
      : -Math.PI / 2

    elements.push({
      type: 'polygon',
      points: createArrowPoints(cx, cy, END_MARKER_SIZE, angle),
      label: 'end',
    })
  }

  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    elements,
  }
}

/** Find the last action of a given type in the stack */
function findLastAction(
  actions: DrawAction[],
  type: DrawAction['type']
): DrawAction | undefined {
  for (let i = actions.length - 1; i >= 0; i--) {
    if (actions[i].type === type) return actions[i]
  }
  return undefined
}
