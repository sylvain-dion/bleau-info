import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/offline/storage-quota'

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

/**
 * Toast notification for sync started.
 */
export function showSyncStartedToast(): void {
  toast.loading('Synchronisation en cours...', {
    id: 'sync-progress',
    duration: 60000,
  })
}

/**
 * Toast notification for successful full sync.
 */
export function showSyncCompleteToast(count: number): void {
  toast.dismiss('sync-progress')
  toast.success(`Synchronisation terminée • ${count} élément${count > 1 ? 's' : ''} envoyé${count > 1 ? 's' : ''}`, {
    duration: 4000,
  })
}

/**
 * Toast notification for partial sync (some items failed).
 */
export function showSyncPartialToast(synced: number, failed: number): void {
  toast.dismiss('sync-progress')
  toast.warning(`${synced} synchronisé${synced > 1 ? 's' : ''}, ${failed} en erreur`, {
    description: 'Les éléments en erreur seront retentés automatiquement.',
    duration: 5000,
  })
}

// ---------------------------------------------------------------------------
// Hard Reset (Story 6.3)
// ---------------------------------------------------------------------------

/** Show success toast after hard reset + reload */
export function showHardResetToast(): void {
  toast.success('Cache vidé • Données à jour', {
    duration: 4000,
  })
}

// ---------------------------------------------------------------------------
// Storage Manager (Story 6.4)
// ---------------------------------------------------------------------------

/** Show success toast after a sector pack is removed */
export function showSectorRemovedToast(sectorName: string, freedBytes: number): void {
  const freed = formatBytes(freedBytes)
  toast.success(`Pack supprimé • ${freed} libérés`, {
    description: sectorName,
    duration: 4000,
  })
}

/** Show error toast when sector removal fails */
export function showSectorRemoveErrorToast(sectorName: string): void {
  toast.error('Erreur de suppression', {
    description: `Impossible de supprimer le pack "${sectorName}".`,
    duration: 5000,
  })
}

// ---------------------------------------------------------------------------
// Conflict Resolution (Story 6.5)
// ---------------------------------------------------------------------------

/** Show warning toast when geographic conflicts are detected during sync */
export function showConflictDetectedToast(count: number): void {
  toast.warning(
    `${count} conflit${count > 1 ? 's' : ''} détecté${count > 1 ? 's' : ''}`,
    {
      description: 'Vérification manuelle nécessaire dans votre profil.',
      duration: 6000,
    }
  )
}

/** Show success toast when a conflict is resolved */
export function showConflictResolvedToast(): void {
  toast.success('Conflit résolu', { duration: 3000 })
}

// ---------------------------------------------------------------------------
// Moderation Actions (Story 7.4)
// ---------------------------------------------------------------------------

/** Show success toast when a submission is approved */
export function showApprovedToast(name: string): void {
  toast.success(`"${name}" validé`, {
    description: 'Le bloc a été ajouté à la base.',
    duration: 4000,
  })
}

/** Show toast when a submission is rejected */
export function showRejectedToast(name: string): void {
  toast('Soumission rejetée', {
    description: `"${name}" a été rejeté.`,
    duration: 4000,
  })
}

/** Show toast when corrections are requested */
export function showCorrectionsRequestedToast(name: string): void {
  toast.warning('Corrections demandées', {
    description: `L'auteur de "${name}" sera notifié.`,
    duration: 4000,
  })
}

// ---------------------------------------------------------------------------
// Auto-Validation (Story 7.5)
// ---------------------------------------------------------------------------

/** Show toast when a submission is auto-validated (trusted user) */
export function showAutoValidatedToast(name: string): void {
  toast.success('Publication instantanée ⚡', {
    description: `"${name}" est publié — votre statut Trusted le permet.`,
    duration: 5000,
  })
}

// ---------------------------------------------------------------------------
// Comments (Story 8.1)
// ---------------------------------------------------------------------------

/** Show toast when a comment is posted */
export function showCommentPostedToast(): void {
  toast.success('Commentaire publié', { duration: 3000 })
}

// ---------------------------------------------------------------------------
// Conditions (Story 8.2)
// ---------------------------------------------------------------------------

/** Show toast when a condition report is submitted */
export function showConditionReportedToast(): void {
  toast.success('Conditions reportées', { duration: 3000 })
}
