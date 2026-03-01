'use client'

import { useCallback, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ZoomIn, ZoomOut, Maximize, Mountain } from 'lucide-react'
import { CIRCUIT_COLORS } from '@/lib/data/mock-boulders'
import type { CircuitColor } from '@/lib/data/mock-boulders'
import type { TopoDrawing } from '@/lib/data/mock-topos'

/** Default stroke color for boulders without a circuit */
const DEFAULT_STROKE_COLOR = '#a1a1aa'

/** Min / Max zoom bounds */
const MIN_SCALE = 1
const MAX_SCALE = 4

interface TopoViewerProps {
  /** Boulder name for accessibility alt text */
  boulderName: string
  /** Photo URL — null renders a placeholder rock background */
  photoUrl: string | null
  /** Circuit color to apply to the SVG route stroke */
  circuitColor: CircuitColor | null
  /** SVG topo drawing overlay data */
  drawing: TopoDrawing
}

export function TopoViewer({ boulderName, photoUrl, circuitColor, drawing }: TopoViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const strokeColor = circuitColor ? CIRCUIT_COLORS[circuitColor] : DEFAULT_STROKE_COLOR

  /** Parse viewBox to get width/height for aspect ratio */
  const [, , vbWidth, vbHeight] = drawing.viewBox.split(' ').map(Number)
  const aspectRatio = vbWidth && vbHeight ? vbWidth / vbHeight : 4 / 3

  const handleImageLoad = useCallback(() => setImageLoaded(true), [])
  const handleImageError = useCallback(() => setImageError(true), [])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Topo</h3>

      <div
        className="relative overflow-hidden rounded-xl border border-border"
        style={{ aspectRatio }}
      >
        <TransformWrapper
          minScale={MIN_SCALE}
          maxScale={MAX_SCALE}
          wheel={{ smoothStep: 0.05 }}
          doubleClick={{ mode: 'toggle', step: 2 }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              <ZoomControls
                onZoomIn={() => zoomIn(0.5)}
                onZoomOut={() => zoomOut(0.5)}
                onReset={() => resetTransform()}
              />

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                {/* Photo layer or placeholder */}
                <div className="relative h-full w-full">
                  {photoUrl && !imageError ? (
                    <>
                      {/* BlurHash-style placeholder shown during load */}
                      {!imageLoaded && <PhotoPlaceholder />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Topo ${boulderName}`}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        draggable={false}
                      />
                    </>
                  ) : (
                    <PhotoPlaceholder />
                  )}

                  {/* SVG overlay */}
                  <svg
                    viewBox={drawing.viewBox}
                    className="absolute inset-0 h-full w-full"
                    aria-label={`Tracé de ${boulderName}`}
                    role="img"
                  >
                    {drawing.elements.map((el, i) => {
                      switch (el.type) {
                        case 'path':
                          return (
                            <path
                              key={i}
                              d={el.d}
                              stroke={strokeColor}
                              strokeWidth={3.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                            />
                          )
                        case 'circle':
                          return (
                            <circle
                              key={i}
                              cx={el.cx}
                              cy={el.cy}
                              r={el.r}
                              fill={strokeColor}
                              stroke="#ffffff"
                              strokeWidth={2.5}
                              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                            />
                          )
                        case 'polygon':
                          return (
                            <polygon
                              key={i}
                              points={el.points}
                              fill={strokeColor}
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                            />
                          )
                      }
                    })}
                  </svg>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Legend */}
        <TopoLegend strokeColor={strokeColor} />
      </div>

      {/* Zoom hint */}
      <p className="text-center text-xs text-muted-foreground">
        Pincez pour zoomer · Double-tap pour agrandir
      </p>
    </div>
  )
}

/** Placeholder background simulating a rock surface */
function PhotoPlaceholder() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background:
          'linear-gradient(135deg, #a8a29e 0%, #78716c 25%, #a8a29e 50%, #78716c 75%, #a8a29e 100%)',
        backgroundSize: '200% 200%',
      }}
    >
      <div className="text-center text-white/60">
        <Mountain className="mx-auto mb-1 h-8 w-8" />
        <p className="text-xs font-medium">Photo à venir</p>
      </div>
    </div>
  )
}

/** Zoom control buttons overlay */
function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Zoomer"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Dézoomer"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label="Réinitialiser le zoom"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Small legend showing start/end markers */
function TopoLegend({ strokeColor }: { strokeColor: string }) {
  return (
    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-3 rounded-lg bg-background/80 px-2.5 py-1.5 text-xs backdrop-blur">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3 w-3 rounded-full border border-white"
          style={{ backgroundColor: strokeColor }}
        />
        Départ
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="12" height="10" viewBox="0 0 12 10" className="inline-block">
          <polygon points="0,10 6,0 12,10" fill={strokeColor} stroke="#fff" strokeWidth="1" />
        </svg>
        Arrivée
      </span>
    </div>
  )
}
