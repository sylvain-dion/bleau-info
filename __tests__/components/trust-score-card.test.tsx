import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrustScoreCard } from '@/components/profile/trust-score-card'

describe('TrustScoreCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Role badge rendering ---

  it('should display "Utilisateur" badge for score 0 with no role', () => {
    render(<TrustScoreCard trustScore={0} />)
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
    expect(screen.getByText('0 pts')).toBeInTheDocument()
  })

  it('should display "Contributeur" badge for score > 0', () => {
    render(<TrustScoreCard trustScore={25} />)
    expect(screen.getByText('Contributeur')).toBeInTheDocument()
    expect(screen.getByText('25 pts')).toBeInTheDocument()
  })

  it('should display "Trusted" badge for score >= 100', () => {
    render(<TrustScoreCard trustScore={100} />)
    expect(screen.getByText('Trusted')).toBeInTheDocument()
    expect(screen.getByText('100 pts')).toBeInTheDocument()
  })

  it('should display "Modérateur" badge when role is moderator', () => {
    render(<TrustScoreCard trustScore={50} role="moderator" />)
    expect(screen.getByText('Modérateur')).toBeInTheDocument()
  })

  it('should display "Admin" badge when role is admin', () => {
    render(<TrustScoreCard trustScore={0} role="admin" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  // --- Progress bar ---

  it('should show progress bar for "Utilisateur" level', () => {
    render(<TrustScoreCard trustScore={0} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('0 / 100 points')).toBeInTheDocument()
  })

  it('should show progress bar for "Contributeur" level with correct values', () => {
    render(<TrustScoreCard trustScore={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('50 / 100 points')).toBeInTheDocument()
  })

  it('should NOT show progress bar for "Trusted" (max score-based level)', () => {
    render(<TrustScoreCard trustScore={150} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Niveau maximum atteint')).toBeInTheDocument()
  })

  it('should NOT show progress bar for moderator', () => {
    render(<TrustScoreCard trustScore={50} role="moderator" />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Niveau maximum atteint')).toBeInTheDocument()
  })

  it('should NOT show progress bar for admin', () => {
    render(<TrustScoreCard trustScore={0} role="admin" />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  // --- Tooltip ---

  it('should show tooltip on info button click', () => {
    render(<TrustScoreCard trustScore={25} />)

    // Tooltip should not be visible initially
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    // Click the info button
    fireEvent.click(screen.getByLabelText('Informations sur les privilèges'))

    // Tooltip should now be visible
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByText('Vos contributions sont soumises à la modération.')).toBeInTheDocument()
  })

  it('should display privilege text for Trusted role in tooltip', () => {
    render(<TrustScoreCard trustScore={100} />)
    fireEvent.click(screen.getByLabelText('Informations sur les privilèges'))

    expect(screen.getByText('Vos ajouts de blocs sont validés instantanément.')).toBeInTheDocument()
  })

  it('should display points remaining in tooltip when next level exists', () => {
    render(<TrustScoreCard trustScore={30} />)
    fireEvent.click(screen.getByLabelText('Informations sur les privilèges'))

    expect(screen.getByText('70')).toBeInTheDocument() // 100 - 30 = 70 points remaining
    expect(screen.getByText('Trusted')).toBeInTheDocument()
  })

  // --- Edge cases ---

  it('should handle score exactly at threshold (100)', () => {
    render(<TrustScoreCard trustScore={100} />)
    expect(screen.getByText('Trusted')).toBeInTheDocument()
    // Trusted is the max score-based role, so no progress bar
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should handle score well above threshold', () => {
    render(<TrustScoreCard trustScore={500} />)
    expect(screen.getByText('Trusted')).toBeInTheDocument()
    expect(screen.getByText('500 pts')).toBeInTheDocument()
  })

  it('should fall back to "Utilisateur" for unknown role string', () => {
    render(<TrustScoreCard trustScore={0} role="unknown-role" />)
    expect(screen.getByText('Utilisateur')).toBeInTheDocument()
  })

  it('should display section title', () => {
    render(<TrustScoreCard trustScore={0} />)
    expect(screen.getByText('Statut communautaire')).toBeInTheDocument()
  })
})
