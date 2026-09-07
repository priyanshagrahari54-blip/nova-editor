import type { EditorSettings } from '../App'

export const PHOTO_ADJUSTMENT_DEFAULTS: Partial<EditorSettings> = {
  brightness: 100,
  contrast: 100,
  exposure: 0,
  saturation: 100,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
}

// Fast clamping to [0, 255] byte range using inline bounds checks and bitwise truncation
const clampChannel = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : (value + 0.5) | 0)

export function buildPhotoFilter(settings: EditorSettings) {
  const exposureMultiplier = 2 ** (settings.exposure / 100)
  const brightness = Math.max(0, settings.brightness * exposureMultiplier + settings.lift * .35 + settings.gamma * .2)
  const contrast = Math.max(0, settings.contrast + settings.sharpness / 3 + settings.gain * .4 - settings.fade * .22)
  if (Math.abs(brightness - 100) < .001 && Math.abs(contrast - 100) < .001 && settings.saturation === 100 && settings.hue === 0 && settings.blur === 0) return 'none'
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hue}deg) blur(${settings.blur}px)`
}

// Reusable static lookup table array (65,281 elements mapping 255 * 256 luminance range)
const toneDeltaLUT = new Float32Array(65281)

/**
 * Applies selective highlight/shadow and color temperature/tint adjustments to raw pixel data.
 *
 * PERFORMANCE OPTIMIZATION:
 * Pre-computes per-frame invariant factors (temperature/tint deltas) and pre-calculates tone deltas
 * in a 65,281-entry lookup table (`toneDeltaLUT`) mapped to integer luminance (red * 54 + green * 183 + blue * 19).
 * Replaces 8 floating-point multiplications per pixel with a single integer LUT lookup per pixel.
 */
export function applySelectivePhotoAdjustments(context: CanvasRenderingContext2D, width: number, height: number, settings: EditorSettings) {
  if (settings.highlights === 0 && settings.shadows === 0 && settings.temperature === 0 && settings.tint === 0) return
  const frame = context.getImageData(0, 0, width, height)
  const pixels = frame.data

  // Pre-calculate per-frame invariant factors outside the loop
  const shadowFactor = (settings.shadows / 100) * 62
  const highlightFactor = (settings.highlights / 100) * 62
  const tempFactor = settings.temperature / 100
  const tintFactor = settings.tint / 100

  const redConst = tempFactor * 28 + tintFactor * 14
  const greenConst = -tintFactor * 18
  const blueConst = -tempFactor * 28 + tintFactor * 14
  const inv65280 = 1 / 65280 // 256 * 255 reciprocal multiplier

  const hasToneAdjustment = settings.shadows !== 0 || settings.highlights !== 0

  // Pre-fill the LUT for all 65,281 integer luminance values outside the pixel loop
  if (hasToneAdjustment) {
    for (let luminance = 0; luminance <= 65280; luminance += 1) {
      const normalized = luminance * inv65280
      const shadowWeight = 1 - normalized
      const highlightWeight = normalized
      toneDeltaLUT[luminance] = shadowFactor * shadowWeight * shadowWeight + highlightFactor * highlightWeight * highlightWeight
    }
  }

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]

    const toneDelta = hasToneAdjustment ? toneDeltaLUT[red * 54 + green * 183 + blue * 19] : 0

    pixels[index] = clampChannel(red + toneDelta + redConst)
    pixels[index + 1] = clampChannel(green + toneDelta + greenConst)
    pixels[index + 2] = clampChannel(blue + toneDelta + blueConst)
  }
  context.putImageData(frame, 0, 0)
}
