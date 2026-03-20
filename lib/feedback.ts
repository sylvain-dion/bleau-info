import confetti from 'canvas-confetti'
import { toast } from 'sonner'

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

/**
 * Toast notification for successful draft save.
 */
export function showDraftSavedToast(): void {
  toast.success('Brouillon sauvegardé', {
    description: 'Votre bloc est enregistré localement.',
    duration: 3000,
  })
}

/**
 * Toast notification for draft save error.
 */
export function showDraftErrorToast(message?: string): void {
  toast.error('Erreur de sauvegarde', {
    description: message ?? 'Impossible d\'enregistrer le brouillon.',
    duration: 5000,
  })
}

/**
 * Toast notification for successful suggestion submission.
 */
export function showSuggestionSentToast(): void {
  toast.success('Suggestion envoyée', {
    description: 'Vous serez notifié du résultat.',
    duration: 4000,
  })
}

/**
 * Toast notification for successful video submission.
 */
export function showVideoSubmittedToast(): void {
  toast.success('Vidéo soumise', {
    description: 'En attente de validation par la communauté.',
    duration: 4000,
  })
}

/**
 * Toast notification for successful sector download.
 */
export function showSectorDownloadedToast(sectorName: string): void {
  toast.success(`Secteur ${sectorName} disponible offline`, {
    description: 'Données accessibles sans connexion.',
    duration: 4000,
  })
}

/**
 * Toast notification for sector download error.
 */
export function showSectorDownloadErrorToast(sectorName: string): void {
  toast.error('Erreur de téléchargement', {
    description: `Impossible de télécharger le secteur ${sectorName}.`,
    duration: 5000,
  })
}
