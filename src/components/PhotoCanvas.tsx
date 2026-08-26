import { PointerEvent, useEffect, useRef, useState } from 'react'
import type { EditorLayer, EditorSettings } from '../App'
import { applySelectivePhotoAdjustments, buildPhotoFilter } from '../lib/photoAdjustments'
import { clampCropRect, cropForAspect, FULL_CROP, rotatedBounds, type CropAspect, type CropRect } from '../lib/photoGeometry'

type Props = { src: string; fileName: string; settings: EditorSettings; before: boolean; layers: EditorLayer[]; resetViewToken: number; cropMode: boolean; cropRect: CropRect; cropAspect: CropAspect; onImageReady: (width: number, height: number) => void; onCropChange: (rect: CropRect) => void }
type LoadedImage = { src: string; image: HTMLImageElement }
type CropHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
type DragState = { kind: 'pan'; x: number; y: number; left: number; top: number } | { kind: 'crop'; handle: CropHandle; x: number; y: number; rect: CropRect }

const PREVIEW_MAX_EDGE = 1600

function normalizedRotation(value: number) {
  return ((value % 360) + 360) % 360
}

function cropHandleAtPoint(rect: CropRect, x: number, y: number, thresholdX: number, thresholdY: number): CropHandle | null {
  const left = rect.x; const right = rect.x + rect.width; const top = rect.y; const bottom = rect.y + rect.height
  const nearLeft = Math.abs(x - left) <= thresholdX; const nearRight = Math.abs(x - right) <= thresholdX
  const nearTop = Math.abs(y - top) <= thresholdY; const nearBottom = Math.abs(y - bottom) <= thresholdY
  if (nearLeft && nearTop) return 'nw'; if (nearRight && nearTop) return 'ne'; if (nearLeft && nearBottom) return 'sw'; if (nearRight && nearBottom) return 'se'
  if (nearTop && x >= left && x <= right) return 'n'; if (nearBottom && x >= left && x <= right) return 's'
  if (nearLeft && y >= top && y <= bottom) return 'w'; if (nearRight && y >= top && y <= bottom) return 'e'
  return x >= left && x <= right && y >= top && y <= bottom ? 'move' : null
}

function resizeCrop(start: CropRect, handle: CropHandle, deltaX: number, deltaY: number, aspect: CropAspect, imageWidth: number, imageHeight: number) {
  if (handle === 'move') return clampCropRect({ ...start, x: start.x + deltaX, y: start.y + deltaY })
  let left = start.x; let right = start.x + start.width; let top = start.y; let bottom = start.y + start.height
  if (handle.includes('w')) left += deltaX
  if (handle.includes('e')) right += deltaX
  if (handle.includes('n')) top += deltaY
  if (handle.includes('s')) bottom += deltaY
  left = Math.max(0, Math.min(right - .03, left)); right = Math.min(1, Math.max(left + .03, right))
  top = Math.max(0, Math.min(bottom - .03, top)); bottom = Math.min(1, Math.max(top + .03, bottom))
  const resized = { x: left, y: top, width: right - left, height: bottom - top }
  return aspect === 'free' ? clampCropRect(resized) : cropForAspect(resized, aspect, imageWidth, imageHeight)
}

export function PhotoCanvas({ src, fileName, settings, before, layers, resetViewToken, cropMode, cropRect, cropAspect, onImageReady, onCropChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<LoadedImage | null>(null)
  const imageReadyRef = useRef(onImageReady)
  const dragRef = useRef<DragState | null>(null)
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
      const editingCrop = cropMode && !before
      const appliedCrop = before || editingCrop ? FULL_CROP : cropRect
      const sx = Math.round(image.naturalWidth * appliedCrop.x); const sy = Math.round(image.naturalHeight * appliedCrop.y)
      const sw = Math.max(1, Math.round(image.naturalWidth * appliedCrop.width)); const sh = Math.max(1, Math.round(image.naturalHeight * appliedCrop.height))
      const previewScale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(sw, sh))
      const drawWidth = Math.max(1, Math.round(sw * previewScale)); const drawHeight = Math.max(1, Math.round(sh * previewScale))
      const rotation = before || editingCrop ? 0 : normalizedRotation(settings.rotate)
      const bounds = rotatedBounds(drawWidth, drawHeight, rotation)
      canvas.width = Math.max(1, Math.round(bounds.width)); canvas.height = Math.max(1, Math.round(bounds.height))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      ctx.save(); ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = before ? 'none' : buildPhotoFilter(settings)
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rotation * Math.PI / 180)
      ctx.scale(before || editingCrop ? 1 : settings.flip ? -1 : 1, before || editingCrop ? 1 : settings.flipVertical ? -1 : 1)
      if (!before && settings.glow > 0) {
        ctx.save(); ctx.globalAlpha = settings.glow / 90; ctx.globalCompositeOperation = 'screen'; ctx.filter = `${buildPhotoFilter(settings)} blur(${settings.glow / 2}px)`; ctx.drawImage(image, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); ctx.restore()
      }
      ctx.drawImage(image, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
      ctx.restore()
      if (!before) {
        applySelectivePhotoAdjustments(ctx, canvas.width, canvas.height, settings)
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
        if (editingCrop) {
          const cropX = cropRect.x * canvas.width; const cropY = cropRect.y * canvas.height
          const cropWidth = cropRect.width * canvas.width; const cropHeight = cropRect.height * canvas.height
          ctx.save(); ctx.fillStyle = '#050509a8'; ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.rect(cropX, cropY, cropWidth, cropHeight); ctx.fill('evenodd')
          ctx.strokeStyle = '#f0e8ff'; ctx.lineWidth = Math.max(1, canvas.width / 700); ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
          ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 1; for (let index = 1; index < 3; index += 1) { const x = cropX + cropWidth * index / 3; const y = cropY + cropHeight * index / 3; ctx.beginPath(); ctx.moveTo(x, cropY); ctx.lineTo(x, cropY + cropHeight); ctx.moveTo(cropX, y); ctx.lineTo(cropX + cropWidth, y); ctx.stroke() }
          const handleSize = Math.max(8, canvas.width / 90); ctx.fillStyle = '#f4eaff'; for (const [x, y] of [[cropX, cropY], [cropX + cropWidth / 2, cropY], [cropX + cropWidth, cropY], [cropX, cropY + cropHeight / 2], [cropX + cropWidth, cropY + cropHeight / 2], [cropX, cropY + cropHeight], [cropX + cropWidth / 2, cropY + cropHeight], [cropX + cropWidth, cropY + cropHeight]]) ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
          ctx.restore()
        }
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [src, settings, before, layers, imageRevision, cropMode, cropRect])

  const startInteraction = (event: PointerEvent<HTMLCanvasElement>) => {
    if (cropMode && !before) {
      const bounds = event.currentTarget.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width; const y = (event.clientY - bounds.top) / bounds.height
      const handle = cropHandleAtPoint(cropRect, x, y, 12 / bounds.width, 12 / bounds.height)
      if (!handle) return
      dragRef.current = { kind: 'crop', handle, x, y, rect: cropRect }
    } else dragRef.current = { kind: 'pan', x: event.clientX, y: event.clientY, left: pan.x, top: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveInteraction = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (drag.kind === 'pan') { setPanState({ src, resetViewToken, x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y }); return }
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width; const y = (event.clientY - bounds.top) / bounds.height
    const image = imageRef.current?.image
    if (!image) return
    onCropChange(resizeCrop(drag.rect, drag.handle, x - drag.x, y - drag.y, cropAspect, image.naturalWidth, image.naturalHeight))
  }
  const endInteraction = () => { dragRef.current = null }
  return <canvas ref={canvasRef} className={`photo-canvas ${cropMode && !before ? 'crop-active' : ''}`} aria-label={`${before ? 'Original preview' : cropMode ? 'Interactive crop canvas' : 'Edited canvas'} for ${fileName}`} onPointerDown={startInteraction} onPointerMove={moveInteraction} onPointerUp={endInteraction} onPointerCancel={endInteraction} style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${settings.zoom / 100})` }}/>
}
