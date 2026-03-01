import type { CircuitColor } from './mock-boulders'

/** A single SVG element in a topo drawing */
export type TopoElement =
  | { type: 'path'; d: string; label?: 'route' }
  | { type: 'circle'; cx: number; cy: number; r: number; label: 'start' }
  | { type: 'polygon'; points: string; label: 'end' }

/** Topo drawing data for a boulder */
export interface TopoDrawing {
  /** SVG viewBox dimensions (width x height matching the photo) */
  viewBox: string
  /** SVG elements composing the route line, start and end markers */
  elements: TopoElement[]
}

/** Full topo data for a boulder */
export interface TopoData {
  /** Boulder ID reference */
  boulderId: string
  /** Photo URL (null = placeholder until real photos are uploaded) */
  photoUrl: string | null
  /** Circuit color for stroke rendering */
  circuitColor: CircuitColor | null
  /** SVG topo drawing overlay */
  drawing: TopoDrawing
}

/**
 * Mock topo data for a subset of boulders.
 *
 * In production, this will come from Supabase `boulders.topo_drawing` + Storage.
 * Not every boulder has a topo — only those with contributed photos + routes.
 */
export const mockTopos: Record<string, TopoData> = {
  // ── La Marie-Rose (6a, dalle, rouge) — iconic Bleau problem ──
  'cul-de-chien-1': {
    boulderId: 'cul-de-chien-1',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 320 520 Q 310 460 330 400 Q 350 340 370 280 Q 380 220 400 170 Q 420 130 440 90',
          label: 'route',
        },
        { type: 'circle', cx: 320, cy: 520, r: 14, label: 'start' },
        { type: 'polygon', points: '430,80 450,90 440,100', label: 'end' },
      ],
    },
  },

  // ── Le Surplomb de la Marie-Rose (6b, dévers, rouge) ──
  'cul-de-chien-2': {
    boulderId: 'cul-de-chien-2',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 250 530 Q 260 470 280 420 Q 320 360 380 310 Q 430 260 460 200 Q 470 150 480 100',
          label: 'route',
        },
        { type: 'circle', cx: 250, cy: 530, r: 14, label: 'start' },
        { type: 'polygon', points: '470,90 490,100 480,110', label: 'end' },
      ],
    },
  },

  // ── La Dalle à Poly (4b, dalle, bleu) ──
  'cul-de-chien-4': {
    boulderId: 'cul-de-chien-4',
    photoUrl: null,
    circuitColor: 'bleu',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 400 540 Q 395 480 390 420 Q 385 360 380 300 Q 375 240 370 180 Q 368 140 365 100',
          label: 'route',
        },
        { type: 'circle', cx: 400, cy: 540, r: 14, label: 'start' },
        { type: 'polygon', points: '355,90 375,100 365,110', label: 'end' },
      ],
    },
  },

  // ── L'Hélicoptère (6b+, toit, rouge) — a roof climb ──
  'bas-cuvier-2': {
    boulderId: 'bas-cuvier-2',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 180 500 Q 200 460 250 430 Q 320 400 400 380 Q 480 350 520 300 Q 540 240 530 170 Q 520 120 510 80',
          label: 'route',
        },
        { type: 'circle', cx: 180, cy: 500, r: 14, label: 'start' },
        { type: 'polygon', points: '500,70 520,80 510,90', label: 'end' },
      ],
    },
  },

  // ── Big Boss (7b, toit, hors circuit) ──
  'bas-cuvier-4': {
    boulderId: 'bas-cuvier-4',
    photoUrl: null,
    circuitColor: null,
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 150 520 Q 180 480 230 450 Q 300 410 380 390 Q 460 370 520 330 Q 560 280 570 220 Q 575 160 580 100',
          label: 'route',
        },
        { type: 'circle', cx: 150, cy: 520, r: 14, label: 'start' },
        { type: 'polygon', points: '570,90 590,100 580,110', label: 'end' },
      ],
    },
  },

  // ── L'Angle Parfait (6a, arête, rouge) ──
  'franchard-isatis-1': {
    boulderId: 'franchard-isatis-1',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 400 550 Q 400 490 400 430 Q 400 370 400 310 Q 400 250 400 190 Q 400 140 400 90',
          label: 'route',
        },
        { type: 'circle', cx: 400, cy: 550, r: 14, label: 'start' },
        { type: 'polygon', points: '390,80 410,80 400,65', label: 'end' },
      ],
    },
  },

  // ── Le Bouddha (7a, dévers, hors circuit) ──
  'franchard-isatis-7': {
    boulderId: 'franchard-isatis-7',
    photoUrl: null,
    circuitColor: null,
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 280 540 Q 300 480 340 420 Q 370 370 410 320 Q 440 270 460 210 Q 470 160 475 110',
          label: 'route',
        },
        { type: 'circle', cx: 280, cy: 540, r: 14, label: 'start' },
        { type: 'polygon', points: '465,100 485,110 475,120', label: 'end' },
      ],
    },
  },

  // ── Le Toit Classique (6b, toit, rouge) ──
  'cuvier-rempart-4': {
    boulderId: 'cuvier-rempart-4',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 200 510 Q 220 470 270 440 Q 340 420 420 400 Q 480 370 510 310 Q 520 250 515 190 Q 510 140 505 90',
          label: 'route',
        },
        { type: 'circle', cx: 200, cy: 510, r: 14, label: 'start' },
        { type: 'polygon', points: '495,80 515,90 505,100', label: 'end' },
      ],
    },
  },

  // ── La Traversée du Cul de Chien (5a, traverse, bleu) ──
  'cul-de-chien-8': {
    boulderId: 'cul-de-chien-8',
    photoUrl: null,
    circuitColor: 'bleu',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 100 380 Q 160 370 240 360 Q 340 340 440 330 Q 540 320 620 310 Q 680 300 720 290',
          label: 'route',
        },
        { type: 'circle', cx: 100, cy: 380, r: 14, label: 'start' },
        { type: 'polygon', points: '725,280 735,295 720,300', label: 'end' },
      ],
    },
  },

  // ── L'Arête du Rempart (6a+, arête, rouge) ──
  'cuvier-rempart-3': {
    boulderId: 'cuvier-rempart-3',
    photoUrl: null,
    circuitColor: 'rouge',
    drawing: {
      viewBox: '0 0 800 600',
      elements: [
        {
          type: 'path',
          d: 'M 350 550 Q 360 490 375 430 Q 385 370 390 310 Q 393 250 395 190 Q 397 140 400 90',
          label: 'route',
        },
        { type: 'circle', cx: 350, cy: 550, r: 14, label: 'start' },
        { type: 'polygon', points: '390,80 410,80 400,65', label: 'end' },
      ],
    },
  },
}

/** Look up topo data for a given boulder ID */
export function getTopoData(boulderId: string): TopoData | null {
  return mockTopos[boulderId] ?? null
}
