import { PointerEvent, useEffect, useRef, useState } from 'react'
import type { EditorLayer, EditorSettings } from '../App'

type Props = { src: string; settings: EditorSettings; before: boolean; layers: EditorLayer[] }

function canvasFilter(settings: EditorSettings) {
  return `brightness(${Math.max(0, settings.brightness + settings.exposure)}%) contrast(${settings.contrast + settings.sharpness / 3 + settings.highlights / 3 - settings.shadows / 4}%) saturate(${settings.saturation}%) sepia(${Math.max(0, settings.temperature) / 500}) hue-rotate(${settings.tint / 3}deg) blur(${settings.blur}px)`
}

export function PhotoCanvas({ src, settings, before, layers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useEffect(() => { setPan({ x: 0, y: 0 }) }, [src])
  useEffect(() => {
    let cancelled = false
    const render = () => {
      const canvas = canvasRef.current
      if (!canvas || !imageRef.current || cancelled) return
      const image = imageRef.current
      const crop = before ? 0 : settings.crop / 100
      const sx = Math.round(image.naturalWidth * crop); const sy = Math.round(image.naturalHeight * crop)
      const sw = Math.max(1, image.naturalWidth - sx * 2); const sh = Math.max(1, image.naturalHeight - sy * 2)
      canvas.width = sw; canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.save(); ctx.clearRect(0, 0, sw, sh)
      ctx.filter = before ? 'none' : canvasFilter(settings)
      ctx.translate(sw / 2, sh / 2)
      ctx.rotate((before ? 0 : settings.rotate) * Math.PI / 180)
      ctx.scale(before ? 1 : settings.flip ? -1 : 1, before ? 1 : settings.flipVertical ? -1 : 1)
      ctx.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
      ctx.restore()
      if (!before) {
        layers.filter(layer => layer.type === 'Text' && layer.visible).forEach(layer => {
          ctx.save(); ctx.globalAlpha = layer.opacity / 100; ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 8; ctx.font = `bold ${Math.max(20, Math.round(sw / 16))}px sans-serif`; ctx.fillText(layer.text || 'NOVA TITLE', sw * .12, sh * .85); ctx.restore()
        })
      }
    }
    const image = new Image(); image.onload = () => { imageRef.current = image; render() }; image.src = src
    const frame = window.requestAnimationFrame(render)
    return () => { cancelled = true; window.cancelAnimationFrame(frame) }
  }, [src, settings, before, layers])

  const startPan = (event: PointerEvent<HTMLCanvasElement>) => { dragRef.current = { x: event.clientX, y: event.clientY, left: pan.x, top: pan.y }; event.currentTarget.setPointerCapture(event.pointerId) }
  const movePan = (event: PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (!drag) return; setPan({ x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y }) }
  const endPan = () => { dragRef.current = null }
  return <canvas ref={canvasRef} className="photo-canvas" aria-label="Editable photo canvas" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${settings.zoom / 100})` }}/>
}
