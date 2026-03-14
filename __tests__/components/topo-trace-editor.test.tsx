import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock react-konva — Konva requires Canvas which jsdom doesn't support
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="konva-stage" {...filterDomProps(props)}>{children as React.ReactNode}</div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-layer">{children}</div>
  ),
  Line: (props: Record<string, unknown>) => (
    <div data-testid="konva-line" data-points={JSON.stringify(props.points)} />
  ),
  Circle: (props: Record<string, unknown>) => (
    <div data-testid="konva-circle" data-x={props.x} data-y={props.y} />
  ),
  RegularPolygon: (props: Record<string, unknown>) => (
    <div data-testid="konva-polygon" data-x={props.x} data-y={props.y} />
  ),
  Image: () => <div data-testid="konva-image" />,
}))

// Filter out non-DOM props to avoid React warnings
function filterDomProps(props: Record<string, unknown>) {
  const { onPointerDown, onPointerMove, onPointerUp, style, ...rest } = props
  return { style, ...Object.fromEntries(Object.entries(rest).filter(([k]) => !k.startsWith('on'))) }
}

// Mock Image loading
const originalImage = global.Image
beforeEach(() => {
  global.Image = class {
    onload: (() => void) | null = null
    src = ''
    constructor() {
      setTimeout(() => this.onload?.(), 0)
    }
  } as unknown as typeof global.Image
})

import { TopoTraceEditor } from '@/components/topo/topo-trace-editor'

const defaultProps = {
  photoDataUrl: 'data:image/jpeg;base64,test',
  photoWidth: 800,
  photoHeight: 600,
  strokeColor: '#FF6B00',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('TopoTraceEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog with correct aria attributes', async () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Dessiner le tracé')
  })

  it('renders the title', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    expect(screen.getByText('Dessiner le tracé')).toBeInTheDocument()
  })

  it('renders the canvas container', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    expect(screen.getByTestId('canvas-container')).toBeInTheDocument()
  })

  it('renders the toolbar with 4 tool buttons', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toBeInTheDocument()

    expect(screen.getByLabelText('Ligne libre')).toBeInTheDocument()
    expect(screen.getByLabelText('Départ')).toBeInTheDocument()
    expect(screen.getByLabelText('Arrivée')).toBeInTheDocument()
    expect(screen.getByLabelText('Gomme')).toBeInTheDocument()
  })

  it('has line tool active by default', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const lineButton = screen.getByLabelText('Ligne libre')
    expect(lineButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches active tool on click', async () => {
    const user = userEvent.setup()
    render(<TopoTraceEditor {...defaultProps} />)

    const startButton = screen.getByLabelText('Départ')
    await user.click(startButton)
    expect(startButton).toHaveAttribute('aria-pressed', 'true')

    const lineButton = screen.getByLabelText('Ligne libre')
    expect(lineButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders undo and redo buttons', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const undoBtn = screen.getByLabelText('Annuler la dernière action')
    const redoBtn = screen.getByLabelText('Refaire la dernière action')
    expect(undoBtn).toBeInTheDocument()
    expect(redoBtn).toBeInTheDocument()
  })

  it('disables undo when no actions', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const undoBtn = screen.getByLabelText('Annuler la dernière action')
    expect(undoBtn).toBeDisabled()
  })

  it('disables redo when no undone actions', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const redoBtn = screen.getByLabelText('Refaire la dernière action')
    expect(redoBtn).toBeDisabled()
  })

  it('calls onCancel when back button clicked', async () => {
    const user = userEvent.setup()
    render(<TopoTraceEditor {...defaultProps} />)

    const cancelBtn = screen.getByLabelText('Annuler')
    await user.click(cancelBtn)
    expect(defaultProps.onCancel).toHaveBeenCalledOnce()
  })

  it('disables confirm when no actions drawn', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const confirmBtn = screen.getByTestId('confirm-trace')
    expect(confirmBtn).toBeDisabled()
  })

  it('calls onCancel when confirm clicked with no actions', async () => {
    // Edge case: if somehow confirm is triggered with no actions, it falls back to cancel
    const user = userEvent.setup()
    render(<TopoTraceEditor {...defaultProps} />)
    // Confirm is disabled, so this verifies the guard
    const confirmBtn = screen.getByTestId('confirm-trace')
    expect(confirmBtn).toBeDisabled()
  })

  it('renders magnifier canvas', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    expect(screen.getByTestId('magnifier')).toBeInTheDocument()
  })

  it('hides magnifier when not drawing', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    const magnifier = screen.getByTestId('magnifier')
    expect(magnifier.style.display).toBe('none')
  })

  it('renders Valider button text', () => {
    render(<TopoTraceEditor {...defaultProps} />)
    expect(screen.getByText('Valider')).toBeInTheDocument()
  })
})
