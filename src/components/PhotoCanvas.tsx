import { PointerEvent, useEffect, useRef, useState } from 'react'
import type { EditorLayer, EditorSettings } from '../App'

type Props = { src: string; settings: EditorSettings; before: boolean; layers: EditorLayer[] }

function canvasFilter(settings: EditorSettings) {
  const brightness = Math.max(0, settings.brightness + settings.exposure + settings.lift * .35 + settings.gamma * .2)
  const contrast = Math.max(0, settings.contrast + settings.sharpness / 3 + settings.highlights / 3 - settings.shadows / 4 + settings.gain * .4 - settings.fade * .22)
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${settings.saturation}%) sepia(${Math.max(0, settings.temperature) / 500}) hue-rotate(${settings.tint / 3 + settings.hue}deg) blur(${settings.blur}px)`
}

export function PhotoCanvas({ src, settings, before, layers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [panState, setPanState] = useState({ src, x: 0, y: 0 })
  const pan = panState.src === src ? panState : { src, x: 0, y: 0 }

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
      if (!before && settings.glow > 0) {
        ctx.save(); ctx.globalAlpha = settings.glow / 90; ctx.globalCompositeOperation = 'screen'; ctx.filter = `${canvasFilter(settings)} blur(${settings.glow / 2}px)`; ctx.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh); ctx.restore()
      }
      ctx.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
      ctx.restore()
      if (!before) {
        if (settings.fade > 0) { ctx.save(); ctx.globalAlpha = settings.fade / 350; ctx.fillStyle = '#a49a8d'; ctx.fillRect(0, 0, sw, sh); ctx.restore() }
        if (settings.vignette > 0) {
          const vignette = ctx.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * .18, sw / 2, sh / 2, Math.max(sw, sh) * .72)
          vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(.62, 'rgba(0,0,0,0)'); vignette.addColorStop(1, `rgba(0,0,0,${Math.min(.9, settings.vignette / 105)})`)
          ctx.save(); ctx.fillStyle = vignette; ctx.fillRect(0, 0, sw, sh); ctx.restore()
        }
        if (settings.grain > 0) {
          ctx.save(); ctx.globalAlpha = settings.grain / 430; ctx.fillStyle = '#fff'; let seed = 49297
          const count = Math.min(12000, Math.round(sw * sh / 450 * settings.grain / 30))
          for (let index = 0; index < count; index += 1) { seed = (seed * 233280 + 49297) % 233280; const x = seed / 233280 * sw; seed = (seed * 233280 + 49297) % 233280; const y = seed / 233280 * sh; ctx.fillRect(x, y, 1 + settings.grain / 45, 1 + settings.grain / 45) }
          ctx.restore()
        }
        layers.filter(layer => layer.type === 'Text' && layer.visible).forEach(layer => {
          ctx.save(); ctx.globalAlpha = layer.opacity / 100; ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 8; ctx.font = `bold ${Math.max(20, Math.round(sw / 16))}px sans-serif`; ctx.fillText(layer.text || 'NOVA TITLE', sw * .12, sh * .85); ctx.restore()
        })
      }
    }
    const image = new Image(); image.onload = () => { if (cancelled) return; imageRef.current = image; render() }; image.src = src
    const frame = window.requestAnimationFrame(render)
    return () => { cancelled = true; window.cancelAnimationFrame(frame) }
  }, [src, settings, before, layers])

  const startPan = (event: PointerEvent<HTMLCanvasElement>) => { dragRef.current = { x: event.clientX, y: event.clientY, left: pan.x, top: pan.y }; event.currentTarget.setPointerCapture(event.pointerId) }
  const movePan = (event: PointerEvent<HTMLCanvasElement>) => { const drag = dragRef.current; if (!drag) return; setPanState({ src, x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y }) }
  const endPan = () => { dragRef.current = null }
  return <canvas ref={canvasRef} className="photo-canvas" aria-label="Editable photo canvas" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${settings.zoom / 100})` }}/>
}
