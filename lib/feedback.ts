import confetti from 'canvas-confetti'

/**
 * Triggers celebratory feedback when a tick is logged.
 *
 * - Visual: gold/orange confetti burst ("magnésie" particles — UX-13)
 * - Haptic: short vibration pattern on supported devices
 *
 * Gracefully degrades — no errors if confetti or vibration are unavailable.
 */
export function triggerTickFeedback(): void {
  // Confetti burst
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FF6B00', '#FFA500', '#FFD700', '#FFFFFF', '#FF8C00'],
      disableForReducedMotion: true,
    })
  } catch {
    // Silently ignore — canvas-confetti may not be available in SSR or tests
  }

  // Haptic feedback
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 30, 50])
    }
  } catch {
    // Vibration API not supported — no-op
  }
}
