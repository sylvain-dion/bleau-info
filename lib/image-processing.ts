import { encode } from 'blurhash'

/** Result of processing a photo for boulder creation. */
export interface ProcessedPhoto {
  /** JPEG data URL (resized, EXIF stripped via canvas redraw) */
  dataUrl: string
  /** Resized width in pixels */
  width: number
  /** Resized height in pixels */
  height: number
  /** BlurHash placeholder string */
  blurHash: string
}

/** Max dimension (width or height) for resized photos */
const MAX_DIMENSION = 1200

/** JPEG compression quality (0–1) */
const JPEG_QUALITY = 0.8

/** BlurHash component counts (horizontal × vertical) */
const BLURHASH_X = 4
const BLURHASH_Y = 3

/**
 * Calculate new dimensions preserving aspect ratio within a max bound.
 * Pure function — fully testable without Canvas.
 */
export function calculateResizedDimensions(
  width: number,
  height: number,
  maxDim: number = MAX_DIMENSION
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height }
  }

  const ratio = Math.min(maxDim / width, maxDim / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

/**
 * Load a File as an HTMLImageElement.
 * Uses FileReader + object URL for broad browser support.
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger l\'image'))
    }
    img.src = url
  })
}

/**
 * Resize image and strip EXIF metadata via Canvas redraw.
 * Drawing to canvas naturally removes all EXIF data (including GPS).
 */
function resizeAndStripExif(
  img: HTMLImageElement,
  maxDim: number = MAX_DIMENSION
): HTMLCanvasElement {
  const { width, height } = calculateResizedDimensions(
    img.naturalWidth,
    img.naturalHeight,
    maxDim
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D non disponible')

  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

/**
 * Generate a BlurHash string from a canvas element.
 * Uses a small sample for speed (32×32 max).
 */
function generateBlurHash(canvas: HTMLCanvasElement): string {
  // Sample at a small size for fast hashing
  const sampleSize = 32
  const { width, height } = calculateResizedDimensions(
    canvas.width,
    canvas.height,
    sampleSize
  )

  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = width
  sampleCanvas.height = height

  const ctx = sampleCanvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D non disponible')

  ctx.drawImage(canvas, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)

  return encode(imageData.data, width, height, BLURHASH_X, BLURHASH_Y)
}

/**
 * Process a photo file: resize, strip EXIF, generate blurhash.
 *
 * Returns a ProcessedPhoto with the data URL, dimensions and blurhash.
 * The data URL is NOT persisted — only blurhash + dimensions are saved.
 */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const img = await loadImageFromFile(file)
  const canvas = resizeAndStripExif(img)
  const blurHash = generateBlurHash(canvas)
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)

  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    blurHash,
  }
}
