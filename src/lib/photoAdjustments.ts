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

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

export function buildPhotoFilter(settings: EditorSettings) {
  const exposureMultiplier = 2 ** (settings.exposure / 100)
  const brightness = Math.max(0, settings.brightness * exposureMultiplier + settings.lift * .35 + settings.gamma * .2)
  const contrast = Math.max(0, settings.contrast + settings.sharpness / 3 + settings.gain * .4 - settings.fade * .22)
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${settings.saturation}%) hue-rotate(${settings.hue}deg) blur(${settings.blur}px)`
}

export function applySelectivePhotoAdjustments(context: CanvasRenderingContext2D, width: number, height: number, settings: EditorSettings) {
  if (settings.highlights === 0 && settings.shadows === 0 && settings.temperature === 0 && settings.tint === 0) return
  const frame = context.getImageData(0, 0, width, height)
  const pixels = frame.data
  const shadowAmount = settings.shadows / 100
  const highlightAmount = settings.highlights / 100
  const temperatureAmount = settings.temperature / 100
  const tintAmount = settings.tint / 100

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    const luminance = (red * 54 + green * 183 + blue * 19) / 256
    const normalized = luminance / 255
    const shadowWeight = (1 - normalized) ** 2
    const highlightWeight = normalized ** 2
    const toneDelta = shadowAmount * 62 * shadowWeight + highlightAmount * 62 * highlightWeight
    const warmRed = temperatureAmount * 28
    const warmBlue = -temperatureAmount * 28
    const tintRedBlue = tintAmount * 14
    const tintGreen = -tintAmount * 18

    pixels[index] = clampChannel(red + toneDelta + warmRed + tintRedBlue)
    pixels[index + 1] = clampChannel(green + toneDelta + tintGreen)
    pixels[index + 2] = clampChannel(blue + toneDelta + warmBlue + tintRedBlue)
  }
  context.putImageData(frame, 0, 0)
}
