import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopoViewer } from '@/components/topo/topo-viewer'
import type { TopoDrawing } from '@/lib/data/mock-topos'

// Mock react-zoom-pan-pinch to avoid DOM measurement issues in tests
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: (utils: Record<string, () => void>) => React.ReactNode }) =>
    children({ zoomIn: vi.fn(), zoomOut: vi.fn(), resetTransform: vi.fn() }),
  TransformComponent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const sampleDrawing: TopoDrawing = {
  viewBox: '0 0 800 600',
  elements: [
    {
      type: 'path',
      d: 'M 320 520 Q 310 460 330 400 Q 350 340 370 280',
      label: 'route',
    },
    { type: 'circle', cx: 320, cy: 520, r: 14, label: 'start' },
    { type: 'polygon', points: '360,270 380,280 370,290', label: 'end' },
  ],
}

describe('TopoViewer', () => {
  describe('rendering', () => {
    it('should render the topo heading', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(screen.getByText('Topo')).toBeDefined()
    })

    it('should render zoom hint text', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(
        screen.getByText('Pincez pour zoomer · Double-tap pour agrandir')
      ).toBeDefined()
    })

    it('should render legend with Départ and Arrivée', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(screen.getByText('Départ')).toBeDefined()
      expect(screen.getByText('Arrivée')).toBeDefined()
    })

    it('should render accessible SVG with boulder name', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(screen.getByLabelText('Tracé de La Marie-Rose')).toBeDefined()
    })

    it('should render zoom control buttons', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(screen.getByLabelText('Zoomer')).toBeDefined()
      expect(screen.getByLabelText('Dézoomer')).toBeDefined()
      expect(screen.getByLabelText('Réinitialiser le zoom')).toBeDefined()
    })
  })

  describe('placeholder', () => {
    it('should show placeholder when photoUrl is null', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      expect(screen.getByText('Photo à venir')).toBeDefined()
    })
  })

  describe('SVG elements', () => {
    /** Helper to get the topo SVG (the one with aria-label) */
    function getTopoSvg(container: HTMLElement) {
      return container.querySelector('svg[aria-label]') as SVGElement | null
    }

    it('should render route path element', () => {
      const { container } = render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      expect(svg).not.toBeNull()
      const path = svg!.querySelector('path')
      expect(path).not.toBeNull()
      expect(path?.getAttribute('d')).toBe('M 320 520 Q 310 460 330 400 Q 350 340 370 280')
    })

    it('should render start circle element', () => {
      const { container } = render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      const circles = svg!.querySelectorAll('circle')
      expect(circles.length).toBe(1)
    })

    it('should render end polygon element', () => {
      const { container } = render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      const polygons = svg!.querySelectorAll('polygon')
      expect(polygons.length).toBe(1)
    })

    it('should apply circuit color to route path stroke', () => {
      const { container } = render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl={null}
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      const path = svg!.querySelector('path')
      // Rouge circuit color is #EF4444
      expect(path?.getAttribute('stroke')).toBe('#EF4444')
    })

    it('should apply bleu circuit color', () => {
      const { container } = render(
        <TopoViewer
          boulderName="La Dalle à Poly"
          photoUrl={null}
          circuitColor="bleu"
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      const path = svg!.querySelector('path')
      expect(path?.getAttribute('stroke')).toBe('#3B82F6')
    })

    it('should use default color when circuit is null', () => {
      const { container } = render(
        <TopoViewer
          boulderName="Big Boss"
          photoUrl={null}
          circuitColor={null}
          drawing={sampleDrawing}
        />
      )
      const svg = getTopoSvg(container)
      const path = svg!.querySelector('path')
      // Default zinc-400 color
      expect(path?.getAttribute('stroke')).toBe('#a1a1aa')
    })
  })

  describe('photo loading', () => {
    it('should render img element when photoUrl is provided', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl="https://example.com/photo.jpg"
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      const img = screen.getByAltText('Topo La Marie-Rose')
      expect(img).toBeDefined()
      expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg')
    })

    it('should show placeholder while image is loading', () => {
      render(
        <TopoViewer
          boulderName="La Marie-Rose"
          photoUrl="https://example.com/photo.jpg"
          circuitColor="rouge"
          drawing={sampleDrawing}
        />
      )
      // Placeholder text should be visible before image loads
      expect(screen.getByText('Photo à venir')).toBeDefined()
    })
  })
})
