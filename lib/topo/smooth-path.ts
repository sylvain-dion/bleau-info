/**
 * Bézier smoothing utilities for topo trace drawing.
 *
 * Converts raw touch/mouse points into smooth SVG path `d` strings
 * using Catmull-Rom → Quadratic Bézier interpolation.
 */

/** Minimum distance (px) between consecutive points to keep */
const MIN_POINT_DISTANCE = 3

/**
 * Remove duplicate/too-close points from a flat array [x1,y1,x2,y2,...].
 * Reduces jitter from high-frequency touch events.
 */
export function simplifyPoints(
  points: number[],
  minDistance: number = MIN_POINT_DISTANCE
): number[] {
  if (points.length < 4) return [...points]

  const result = [points[0], points[1]]
  const minDistSq = minDistance * minDistance

  for (let i = 2; i < points.length - 2; i += 2) {
    const prevX = result[result.length - 2]
    const prevY = result[result.length - 1]
    const dx = points[i] - prevX
    const dy = points[i + 1] - prevY

    if (dx * dx + dy * dy >= minDistSq) {
      result.push(points[i], points[i + 1])
    }
  }

  // Always keep the last point
  const lastX = points[points.length - 2]
  const lastY = points[points.length - 1]
  if (result[result.length - 2] !== lastX || result[result.length - 1] !== lastY) {
    result.push(lastX, lastY)
  }

  return result
}

/**
 * Convert flat point array to smooth SVG path using quadratic Bézier curves.
 *
 * Algorithm: For each pair of consecutive midpoints, draw a Q (quadratic Bézier)
 * curve with the original point as the control point. This produces smooth
 * curves that pass through the midpoints of each segment.
 *
 * For 1 point: returns empty string
 * For 2 points: returns a straight line M...L...
 * For 3+ points: returns M + Q segments
 */
export function pointsToSvgPath(points: number[]): string {
  if (points.length < 2) return ''
  if (points.length < 4) return ''

  const x0 = Math.round(points[0])
  const y0 = Math.round(points[1])

  // Only 2 points → straight line
  if (points.length === 4) {
    const x1 = Math.round(points[2])
    const y1 = Math.round(points[3])
    return `M ${x0} ${y0} L ${x1} ${y1}`
  }

  // 3+ points → smooth Bézier path
  let d = `M ${x0} ${y0}`

  // First segment: line to first midpoint
  const mx0 = Math.round((points[0] + points[2]) / 2)
  const my0 = Math.round((points[1] + points[3]) / 2)
  d += ` L ${mx0} ${my0}`

  // Middle segments: quadratic Bézier through midpoints
  for (let i = 2; i < points.length - 2; i += 2) {
    const cx = Math.round(points[i])
    const cy = Math.round(points[i + 1])
    const mx = Math.round((points[i] + points[i + 2]) / 2)
    const my = Math.round((points[i + 1] + points[i + 3]) / 2)
    d += ` Q ${cx} ${cy} ${mx} ${my}`
  }

  // Last segment: line to final point
  const xN = Math.round(points[points.length - 2])
  const yN = Math.round(points[points.length - 1])
  d += ` L ${xN} ${yN}`

  return d
}

/**
 * Create an equilateral triangle (arrow) polygon points string at (x, y).
 *
 * @param x — Center x of the arrow
 * @param y — Center y of the arrow
 * @param size — Radius of the bounding circle (default 10)
 * @param angle — Direction angle in radians (0 = pointing right, default = pointing up = -π/2)
 * @returns SVG polygon `points` attribute string "x1,y1 x2,y2 x3,y3"
 */
export function createArrowPoints(
  x: number,
  y: number,
  size: number = 10,
  angle: number = -Math.PI / 2
): string {
  const points: string[] = []

  for (let i = 0; i < 3; i++) {
    const a = angle + (i * 2 * Math.PI) / 3
    const px = Math.round(x + size * Math.cos(a))
    const py = Math.round(y + size * Math.sin(a))
    points.push(`${px},${py}`)
  }

  return points.join(' ')
}

/**
 * Calculate the angle (in radians) of the last segment of a point array.
 * Returns the direction from second-to-last to last point.
 * Default: pointing up (-π/2) if insufficient points.
 */
export function getLastSegmentAngle(points: number[]): number {
  if (points.length < 4) return -Math.PI / 2

  const x1 = points[points.length - 4]
  const y1 = points[points.length - 3]
  const x2 = points[points.length - 2]
  const y2 = points[points.length - 1]

  return Math.atan2(y2 - y1, x2 - x1)
}
