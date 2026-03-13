/**
 * GPS coordinate formatting and rounding utilities.
 *
 * All coordinates use 6 decimal places (~11cm precision).
 * Display format: "48.382619° N" / "2.634521° E"
 */

/** Number of decimal places for GPS precision (~11cm) */
const COORDINATE_PRECISION = 6

/**
 * Round a coordinate value to 6 decimal places.
 *
 * 6 decimals ≈ 11cm at the equator — sufficient for
 * outdoor boulder placement without false precision.
 */
export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_PRECISION
  return Math.round(value * factor) / factor
}

/**
 * Format a latitude value for display.
 *
 * @example formatLatitude(48.382619) → "48.382619° N"
 * @example formatLatitude(-33.856784) → "33.856784° S"
 */
export function formatLatitude(value: number): string {
  const direction = value >= 0 ? 'N' : 'S'
  return `${Math.abs(roundCoordinate(value)).toFixed(COORDINATE_PRECISION)}° ${direction}`
}

/**
 * Format a longitude value for display.
 *
 * @example formatLongitude(2.634521) → "2.634521° E"
 * @example formatLongitude(-73.985428) → "73.985428° O"
 */
export function formatLongitude(value: number): string {
  const direction = value >= 0 ? 'E' : 'O'
  return `${Math.abs(roundCoordinate(value)).toFixed(COORDINATE_PRECISION)}° ${direction}`
}

/**
 * Format a coordinate pair for compact display.
 *
 * @example formatCoordinates(48.382619, 2.634521) → "48.382619° N, 2.634521° E"
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${formatLatitude(latitude)}, ${formatLongitude(longitude)}`
}
