import type { EditorSettings } from '../App'

export type CropAspect = 'free' | '1:1' | '4:5' | '3:2' | '16:9' | '9:16'
export type CropRect = { x: number; y: number; width: number; height: number }

export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 }

export const cropRectFromSettings = (settings: EditorSettings): CropRect => ({
  x: settings.cropX,
  y: settings.cropY,
  width: settings.cropWidth,
  height: settings.cropHeight,
})

export const cropSettings = (rect: CropRect): Partial<EditorSettings> => ({
  cropX: rect.x,
  cropY: rect.y,
  cropWidth: rect.width,
  cropHeight: rect.height,
})

export function normalizedRotation(value: number) {
  return ((value % 360) + 360) % 360
}

export function signedRotation(value: number) {
  const normalized = normalizedRotation(value)
  return normalized > 180 ? normalized - 360 : normalized
}

export function rotatedBounds(width: number, height: number, degrees: number) {
  const radians = normalizedRotation(degrees) * Math.PI / 180
  const cosine = Math.abs(Math.cos(radians))
  const sine = Math.abs(Math.sin(radians))
  return { width: width * cosine + height * sine, height: width * sine + height * cosine }
}

export function clampCropRect(rect: CropRect, minimum = .03): CropRect {
  const width = Math.max(minimum, Math.min(1, rect.width))
  const height = Math.max(minimum, Math.min(1, rect.height))
  return {
    x: Math.max(0, Math.min(1 - width, rect.x)),
    y: Math.max(0, Math.min(1 - height, rect.y)),
    width,
    height,
  }
}

export function aspectValue(aspect: CropAspect) {
  if (aspect === 'free') return null
  const [width, height] = aspect.split(':').map(Number)
  return width / height
}

export function cropForAspect(rect: CropRect, aspect: CropAspect, imageWidth: number, imageHeight: number) {
  const ratio = aspectValue(aspect)
  if (!ratio || !imageWidth || !imageHeight) return clampCropRect(rect)
  const normalizedRatio = ratio / (imageWidth / imageHeight)
  let width = rect.width
  let height = rect.height
  if (width / height > normalizedRatio) width = height * normalizedRatio
  else height = width / normalizedRatio
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  return clampCropRect({ x: centerX - width / 2, y: centerY - height / 2, width, height })
}
