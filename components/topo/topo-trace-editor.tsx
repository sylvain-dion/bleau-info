'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Stage, Layer, Line, Circle, RegularPolygon, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import {
  ArrowLeft,
  Check,
  Circle as CircleIcon,
  Eraser,
  Pencil,
  Redo2,
  TriangleAlert,
  Undo2,
} from 'lucide-react'
import type { TopoDrawing } from '@/lib/data/mock-topos'
import { actionsToTopoDrawing, type DrawAction } from '@/lib/topo/topo-export'
import { simplifyPoints } from '@/lib/topo/smooth-path'

/** Maximum undo stack depth */
const MAX_UNDO = 20

/** Magnifier size in pixels */
const MAGNIFIER_SIZE = 100

/** Magnifier zoom factor */
const MAGNIFIER_ZOOM = 2.5

/** Magnifier offset from touch point */
const MAGNIFIER_OFFSET = 60

/** Available drawing tools */
export type DrawTool = 'line' | 'start' | 'end' | 'eraser'

interface TopoTraceEditorProps {
  /** JPEG data URL of the boulder photo */
  photoDataUrl: string
  /** Photo width in pixels */
  photoWidth: number
  /** Photo height in pixels */
  photoHeight: number
  /** Stroke color hex for the route trace */
  strokeColor: string
  /** Called when user confirms the drawing */
  onConfirm: (drawing: TopoDrawing) => void
  /** Called when user cancels */
  onCancel: () => void
}

/**
 * Full-screen Konva canvas editor for drawing climbing route traces.
 *
 * Features:
 * - Free-hand line drawing with real-time display
 * - Start (circle) and End (arrow) marker placement
 * - Eraser tool (tap near a line to remove it)
 * - Undo/Redo (max 20 actions)
 * - Magnifying loupe (100×100px, 2.5× zoom) during line drawing
 * - Outputs TopoDrawing compatible with TopoViewer
 */
export function TopoTraceEditor({
  photoDataUrl,
  photoWidth,
  photoHeight,
  strokeColor,
  onConfirm,
  onCancel,
}: TopoTraceEditorProps) {
  const [activeTool, setActiveTool] = useState<DrawTool>('line')
  const [actions, setActions] = useState<DrawAction[]>([])
  const [undoneActions, setUndoneActions] = useState<DrawAction[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null)

  const stageRef = useRef<Konva.Stage>(null)
  const magnifierCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load the photo as an HTML Image
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setPhotoImage(img)
    img.src = photoDataUrl
  }, [photoDataUrl])

  // Calculate canvas dimensions to fit the container while preserving aspect ratio
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const containerW = rect.width
      const containerH = rect.height

      const photoRatio = photoWidth / photoHeight
      const containerRatio = containerW / containerH

      let w: number
      let h: number

      if (photoRatio > containerRatio) {
        w = containerW
        h = containerW / photoRatio
      } else {
        h = containerH
        w = containerH * photoRatio
      }

      setCanvasSize({ width: Math.round(w), height: Math.round(h) })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [photoWidth, photoHeight])

  // Extract current start/end markers from actions
  const startMarker = useMemo(() => {
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i].type === 'start') return actions[i] as DrawAction & { type: 'start' }
    }
    return null
  }, [actions])

  const endMarker = useMemo(() => {
    for (let i = actions.length - 1; i >= 0; i--) {
      if (actions[i].type === 'end') return actions[i] as DrawAction & { type: 'end' }
    }
    return null
  }, [actions])

  // All line actions for rendering
  const lineActions = useMemo(
    () => actions.filter((a): a is DrawAction & { type: 'line' } => a.type === 'line'),
    [actions]
  )

  const addAction = useCallback((action: DrawAction) => {
    setActions((prev) => {
      const next = [...prev, action]
      return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next
    })
    setUndoneActions([]) // Clear redo stack on new action
  }, [])

  const handleUndo = useCallback(() => {
    setActions((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setUndoneActions((u) => [...u, last])
      return prev.slice(0, -1)
    })
  }, [])

  const handleRedo = useCallback(() => {
    setUndoneActions((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setActions((a) => [...a, last])
      return prev.slice(0, -1)
    })
  }, [])

  // Update magnifier canvas
  const updateMagnifier = useCallback((stageX: number, stageY: number) => {
    const stage = stageRef.current
    const canvas = magnifierCanvasRef.current
    if (!stage || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sourceCanvas = stage.toCanvas()
    const srcSize = MAGNIFIER_SIZE / MAGNIFIER_ZOOM

    ctx.clearRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE)
    ctx.save()

    // Draw circular clip
    ctx.beginPath()
    ctx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      sourceCanvas,
      stageX - srcSize / 2,
      stageY - srcSize / 2,
      srcSize,
      srcSize,
      0,
      0,
      MAGNIFIER_SIZE,
      MAGNIFIER_SIZE
    )

    // Draw crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(MAGNIFIER_SIZE / 2, 0)
    ctx.lineTo(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE)
    ctx.moveTo(0, MAGNIFIER_SIZE / 2)
    ctx.lineTo(MAGNIFIER_SIZE, MAGNIFIER_SIZE / 2)
    ctx.stroke()

    // Draw border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2, MAGNIFIER_SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()

    ctx.restore()
  }, [])

  // Pointer event handlers
  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return

    if (activeTool === 'line') {
      setIsDrawing(true)
      setCurrentPoints([pos.x, pos.y])
      setMagnifierPos({ x: pos.x, y: pos.y })
    } else if (activeTool === 'start') {
      addAction({ type: 'start', x: pos.x, y: pos.y })
    } else if (activeTool === 'end') {
      addAction({ type: 'end', x: pos.x, y: pos.y })
    } else if (activeTool === 'eraser') {
      // Find nearest line action and remove it
      handleErase(pos.x, pos.y)
    }
  }, [activeTool, addAction]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!isDrawing) return
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return

    setCurrentPoints((prev) => [...prev, pos.x, pos.y])
    setMagnifierPos({ x: pos.x, y: pos.y })
    updateMagnifier(pos.x, pos.y)
  }, [isDrawing, updateMagnifier])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setMagnifierPos(null)

    if (currentPoints.length >= 4) {
      const simplified = simplifyPoints(currentPoints)
      addAction({ type: 'line', points: simplified })
    }
    setCurrentPoints([])
  }, [isDrawing, currentPoints, addAction])

  const handleErase = useCallback((x: number, y: number) => {
    const threshold = 20 // pixels
    const thresholdSq = threshold * threshold

    // Find the closest line action
    let closestIdx = -1
    let closestDist = Infinity

    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i]
      if (action.type !== 'line') continue

      for (let j = 0; j < action.points.length; j += 2) {
        const dx = action.points[j] - x
        const dy = action.points[j + 1] - y
        const distSq = dx * dx + dy * dy
        if (distSq < thresholdSq && distSq < closestDist) {
          closestDist = distSq
          closestIdx = i
        }
      }
    }

    if (closestIdx >= 0) {
      setActions((prev) => prev.filter((_, idx) => idx !== closestIdx))
      setUndoneActions([]) // Clear redo on erase
    }
  }, [actions])

  const handleConfirm = useCallback(() => {
    if (actions.length === 0) {
      onCancel()
      return
    }
    const drawing = actionsToTopoDrawing(actions, canvasSize.width, canvasSize.height)
    onConfirm(drawing)
  }, [actions, canvasSize, onConfirm, onCancel])

  // Calculate magnifier position (offset from touch, keep in viewport)
  const magnifierStyle = useMemo(() => {
    if (!magnifierPos || !isDrawing) return { display: 'none' as const }

    const containerEl = containerRef.current
    if (!containerEl) return { display: 'none' as const }

    const rect = containerEl.getBoundingClientRect()
    const canvasOffsetX = (rect.width - canvasSize.width) / 2
    const canvasOffsetY = (rect.height - canvasSize.height) / 2

    let left = canvasOffsetX + magnifierPos.x - MAGNIFIER_SIZE - MAGNIFIER_OFFSET
    let top = canvasOffsetY + magnifierPos.y - MAGNIFIER_SIZE - MAGNIFIER_OFFSET

    // Keep magnifier within viewport
    if (left < 8) left = canvasOffsetX + magnifierPos.x + MAGNIFIER_OFFSET
    if (top < 8) top = canvasOffsetY + magnifierPos.y + MAGNIFIER_OFFSET

    return {
      display: 'block' as const,
      left: `${left}px`,
      top: `${top}px`,
    }
  }, [magnifierPos, isDrawing, canvasSize])

  const hasActions = actions.length > 0

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-label="Dessiner le tracé"
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Annuler"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-sm font-semibold text-foreground">
          Dessiner le tracé
        </h2>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasActions}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          data-testid="confirm-trace"
        >
          <Check className="h-4 w-4" />
          Valider
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/90"
        data-testid="canvas-container"
      >
        {canvasSize.width > 0 && photoImage && (
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            <Layer>
              {/* Photo background */}
              <KonvaImage
                image={photoImage}
                width={canvasSize.width}
                height={canvasSize.height}
              />

              {/* Completed line strokes */}
              {lineActions.map((action, i) => (
                <Line
                  key={`line-${i}`}
                  points={action.points}
                  stroke={strokeColor}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.3}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={2}
                  shadowOffsetY={1}
                />
              ))}

              {/* Current drawing stroke (in progress) */}
              {isDrawing && currentPoints.length >= 4 && (
                <Line
                  points={currentPoints}
                  stroke={strokeColor}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.3}
                  opacity={0.7}
                />
              )}

              {/* Start marker */}
              {startMarker && (
                <Circle
                  x={startMarker.x}
                  y={startMarker.y}
                  radius={10}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={2}
                  shadowOffsetY={1}
                />
              )}

              {/* End marker (triangle) */}
              {endMarker && (
                <RegularPolygon
                  x={endMarker.x}
                  y={endMarker.y}
                  sides={3}
                  radius={10}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  rotation={-90}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={2}
                  shadowOffsetY={1}
                />
              )}
            </Layer>
          </Stage>
        )}

        {/* Magnifier loupe */}
        <canvas
          ref={magnifierCanvasRef}
          width={MAGNIFIER_SIZE}
          height={MAGNIFIER_SIZE}
          className="pointer-events-none absolute rounded-full shadow-lg ring-2 ring-white/50"
          style={magnifierStyle}
          data-testid="magnifier"
        />
      </div>

      {/* Toolbar */}
      <div className="border-t border-border bg-background px-4 pb-safe pt-3">
        <div className="flex items-center justify-between">
          {/* Drawing tools */}
          <div className="flex gap-1" role="toolbar" aria-label="Outils de dessin">
            <ToolButton
              icon={<Pencil className="h-4.5 w-4.5" />}
              label="Ligne libre"
              isActive={activeTool === 'line'}
              onClick={() => setActiveTool('line')}
            />
            <ToolButton
              icon={<CircleIcon className="h-4.5 w-4.5" />}
              label="Départ"
              isActive={activeTool === 'start'}
              onClick={() => setActiveTool('start')}
            />
            <ToolButton
              icon={<TriangleAlert className="h-4.5 w-4.5" />}
              label="Arrivée"
              isActive={activeTool === 'end'}
              onClick={() => setActiveTool('end')}
            />
            <ToolButton
              icon={<Eraser className="h-4.5 w-4.5" />}
              label="Gomme"
              isActive={activeTool === 'eraser'}
              onClick={() => setActiveTool('eraser')}
            />
          </div>

          {/* Undo / Redo */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={actions.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Annuler la dernière action"
            >
              <Undo2 className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={undoneActions.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Refaire la dernière action"
            >
              <Redo2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Toolbar button for drawing tool selection */
function ToolButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  )
}

export default TopoTraceEditor
