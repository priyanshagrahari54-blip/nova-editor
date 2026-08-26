import { PointerEvent, useEffect, useRef, useState } from 'react'
import type { EditorLayer, EditorSettings } from '../App'

type Props = { src: string; fileName: string; settings: EditorSettings; before: boolean; layers: EditorLayer[]; resetViewToken: number; onImageReady: (width: number, height: number) => void }
type LoadedImage = { src: string; image: HTMLImageElement }

const PREVIEW_MAX_EDGE = 1600

function normalizedRotation(value: number) {
  return ((value % 360) + 360) % 360
}

function canvasFilter(settings: EditorSettings) {
  const brightness = Math.max(0, settings.brightness + settings.exposure + settings.highlights * .06 + settings.shadows * .1 + settings.lift * .35 + settings.gamma * .2)
  const contrast = Math.max(0, settings.contrast + settings.sharpness / 3 + settings.highlights * .18 - settings.shadows * .14 + settings.gain * .4 - settings.fade * .22)
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${settings.saturation}%) sepia(${Math.abs(settings.temperature) / 900}) hue-rotate(${settings.tint / 4 + settings.hue}deg) blur(${settings.blur}px)`
}

function drawColorCast(context: CanvasRenderingContext2D, width: number, height: number, settings: EditorSettings) {
  if (settings.temperature !== 0) {
    context.save(); context.globalCompositeOperation = 'soft-light'; context.globalAlpha = Math.abs(settings.temperature) / 240; context.fillStyle = settings.temperature > 0 ? '#ff8a3d' : '#4d78ff'; context.fillRect(0, 0, width, height); context.restore()
  }
  if (settings.tint !== 0) {
    context.save(); context.globalCompositeOperation = 'soft-light'; context.globalAlpha = Math.abs(settings.tint) / 270; context.fillStyle = settings.tint > 0 ? '#d85adf' : '#42c88a'; context.fillRect(0, 0, width, height); context.restore()
  }
}

export function PhotoCanvas({ src, fileName, settings, before, layers, resetViewToken, onImageReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<LoadedImage | null>(null)
  const imageReadyRef = useRef(onImageReady)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [imageRevision, setImageRevision] = useState(0)
  const [panState, setPanState] = useState({ src, resetViewToken, x: 0, y: 0 })
  const pan = panState.src === src && panState.resetViewToken === resetViewToken ? panState : { src, resetViewToken, x: 0, y: 0 }

  useEffect(() => { imageReadyRef.current = onImageReady }, [onImageReady])

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => { if (cancelled) return; imageRef.current = { src, image }; imageReadyRef.current(image.naturalWidth, image.naturalHeight); setImageRevision(value => value + 1) }
    image.src = src
    return () => { cancelled = true }
  }, [src])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const loaded = imageRef.current
      if (!canvas || !loaded || loaded.src !== src) return
      const image = loaded.image
      const crop = before ? 0 : settings.crop / 100
      const sx = Math.round(image.naturalWidth * crop); const sy = Math.round(image.naturalHeight * crop)
      const sw = Math.max(1, image.naturalWidth - sx * 2); const sh = Math.max(1, image.naturalHeight - sy * 2)
      const previewScale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(sw, sh))
      const drawWidth = Math.max(1, Math.round(sw * previewScale)); const drawHeight = Math.max(1, Math.round(sh * previewScale))
      const rotation = before ? 0 : normalizedRotation(settings.rotate)
      const quarterTurn = rotation === 90 || rotation === 270
      canvas.width = quarterTurn ? drawHeight : drawWidth; canvas.height = quarterTurn ? drawWidth : drawHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.save(); ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = before ? 'none' : canvasFilter(settings)
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.scale(before ? 1 : settings.flip ? -1 : 1, before ? 1 : settings.flipVertical ? -1 : 1)
      if (!before && settings.glow > 0) {
        ctx.save(); ctx.globalAlpha = settings.glow / 90; ctx.globalCompositeOperation = 'screen'; ctx.filter = `${canvasFilter(settings)} blur(${settings.glow / 2}px)`; ctx.drawImage(image, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); ctx.restore()
      }
      ctx.drawImage(image, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
      ctx.restore()
      if (!before) {
        drawColorCast(ctx, canvas.width, canvas.height, settings)
        if (settings.fade > 0) { ctx.save(); ctx.globalAlpha = settings.fade / 350; ctx.fillStyle = '#a49a8d'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore() }
        if (settings.vignette > 0) {
          const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * .18, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * .72)
          vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(.62, 'rgba(0,0,0,0)'); vignette.addColorStop(1, `rgba(0,0,0,${Math.min(.9, settings.vignette / 105)})`)
          ctx.save(); ctx.fillStyle = vignette; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore()
        }
        if (settings.grain > 0) {
          ctx.save(); ctx.globalAlpha = settings.grain / 430; ctx.fillStyle = '#fff'; let seed = 49297
          const count = Math.min(8000, Math.round(canvas.width * canvas.height / 450 * settings.grain / 30))
          for (let index = 0; index < count; index += 1) { seed = (seed * 233280 + 49297) % 233280; const x = seed / 233280 * canvas.width; seed = (seed * 233280 + 49297) % 233280; const y = seed / 233280 * canvas.height; ctx.fillRect(x, y, 1 + settings.grain / 45, 1 + settings.grain / 45) }
          ctx.restore()
        }
        layers.filter(layer => layer.type === 'Text' && layer.visible).forEach(layer => {
          ctx.save(); ctx.globalAlpha = layer.opacity / 100; ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 8; ctx.font = `bold ${Math.max(20, Math.round(canvas.width / 16))}px sans-serif`; ctx.fillText(layer.text || 'NOVA TITLE', canvas.width * .12, canvas.height * .85); ctx.restore()
        })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [src, settings, before, layers, imageRevision])

  const startPan = (event: PointerEvent<HTMLCanvasElement>) => { dragRef.current = { x: event.clientX, y: event.clientY, left: pan.x, top: pan.y }; event.currentTarget.setPointerCapture(event.pointerId) }
  const movePan = (event: PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (!drag) return; setPanState({ src, resetViewToken, x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y }) }
  const endPan = () => { dragRef.current = null }
  return <canvas ref={canvasRef} className="photo-canvas" aria-label={`${before ? 'Original preview' : 'Edited canvas'} for ${fileName}`} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${settings.zoom / 100})` }}/>
}
