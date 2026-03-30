import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GradeReliabilityPopover } from '@/components/boulder/grade-reliability-popover'

// Mock Radix Popover to avoid portal issues in jsdom
vi.mock('@radix-ui/react-popover', () => ({
  Root: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) => (
    <div data-testid="popover-root" data-open={open}>{children}</div>
  ),
  Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
  Close: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Arrow: () => null,
}))

describe('GradeReliabilityPopover', () => {
  it('renders nothing when reliability is null', () => {
    const { container } = render(
      <GradeReliabilityPopover reliability={null} voteCount={7} stdDev={0.8} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders "Cotation vérifiée" badge for verified', () => {
    render(
      <GradeReliabilityPopover
        reliability="verified"
        voteCount={15}
        stdDev={0.3}
      />
    )
    expect(screen.getAllByText('Cotation vérifiée').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Cotation disputée" badge for disputed', () => {
    render(
      <GradeReliabilityPopover
        reliability="disputed"
        voteCount={8}
        stdDev={1.5}
      />
    )
    expect(screen.getAllByText('Cotation disputée').length).toBeGreaterThanOrEqual(1)
  })

  it('shows verified explanation text', () => {
    render(
      <GradeReliabilityPopover
        reliability="verified"
        voteCount={15}
        stdDev={0.3}
      />
    )
    expect(screen.getByText(/Cette cotation est fiable/)).toBeDefined()
    expect(screen.getByText(/15 votes/)).toBeDefined()
  })

  it('shows disputed explanation text', () => {
    render(
      <GradeReliabilityPopover
        reliability="disputed"
        voteCount={8}
        stdDev={1.5}
      />
    )
    expect(screen.getByText(/Les avis divergent/)).toBeDefined()
  })

  it('has accessible label on badge button', () => {
    render(
      <GradeReliabilityPopover
        reliability="verified"
        voteCount={15}
        stdDev={0.3}
      />
    )
    expect(screen.getByLabelText('Cotation vérifiée')).toBeDefined()
  })
})
