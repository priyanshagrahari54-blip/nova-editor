import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Download, Film, Image as ImageIcon, LoaderCircle, MonitorUp, ShieldCheck, Sparkles, X } from 'lucide-react'
import type { EditorLayer, EditorSettings } from '../App'

type Asset = { name: string; kind: 'image' | 'video'; url: string }
type Resolution = 'source' | '1080' | '2160'
type ImageFormat = 'png' | 'jpeg' | 'webp'
type Props = { asset: Asset | null; settings: EditorSettings; layers: EditorLayer[]; onClose: () => void; onNotice: (message: string) => void }
type CaptureVideo = HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }

function editorFilter(settings: EditorSettings) {
  const brightness = Math.max(0, settings.brightness + settings.exposure + settings.highlights * .06 + settings.shadows * .1 + settings.lift * .35 + settings.gamma * .2)
  const contrast = Math.max(0, settings.contrast + settings.sharpness / 3 + settings.highlights * .18 - settings.shadows * .14 + settings.gain * .4 - settings.fade * .22)
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${settings.saturation}%) sepia(${Math.abs(settings.temperature) / 900}) hue-rotate(${settings.tint / 4 + settings.hue}deg) blur(${settings.blur}px)`
}

function normalizedRotation(value: number) {
  return ((value % 360) + 360) % 360
}

function targetSize(width: number, height: number, resolution: Resolution, settings: EditorSettings) {
  const cropScale = Math.max(.01, 1 - settings.crop / 50)
  const croppedWidth = Math.max(1, Math.round(width * cropScale)); const croppedHeight = Math.max(1, Math.round(height * cropScale))
  const quarterTurn = normalizedRotation(settings.rotate) === 90 || normalizedRotation(settings.rotate) === 270
  const outputWidth = quarterTurn ? croppedHeight : croppedWidth; const outputHeight = quarterTurn ? croppedWidth : croppedHeight
  if (resolution === 'source') return { width: outputWidth, height: outputHeight }
  const targetHeight = resolution === '2160' ? 2160 : 1080
  return { width: Math.round(targetHeight * outputWidth / outputHeight), height: targetHeight }
}

function drawFinishing(context: CanvasRenderingContext2D, width: number, height: number, settings: EditorSettings, layers: EditorLayer[], frame = 0) {
  if (settings.temperature !== 0) { context.save(); context.globalCompositeOperation = 'soft-light'; context.globalAlpha = Math.abs(settings.temperature) / 240; context.fillStyle = settings.temperature > 0 ? '#ff8a3d' : '#4d78ff'; context.fillRect(0, 0, width, height); context.restore() }
  if (settings.tint !== 0) { context.save(); context.globalCompositeOperation = 'soft-light'; context.globalAlpha = Math.abs(settings.tint) / 270; context.fillStyle = settings.tint > 0 ? '#d85adf' : '#42c88a'; context.fillRect(0, 0, width, height); context.restore() }
  if (settings.fade > 0) { context.save(); context.globalAlpha = settings.fade / 350; context.fillStyle = '#a49a8d'; context.fillRect(0, 0, width, height); context.restore() }
  if (settings.vignette > 0) {
    const gradient = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .18, width / 2, height / 2, Math.max(width, height) * .72)
    gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(.62, 'rgba(0,0,0,0)'); gradient.addColorStop(1, `rgba(0,0,0,${Math.min(.9, settings.vignette / 105)})`)
    context.save(); context.fillStyle = gradient; context.fillRect(0, 0, width, height); context.restore()
  }
  if (settings.grain > 0) {
    context.save(); context.globalAlpha = settings.grain / 430; context.fillStyle = frame % 2 ? '#fff' : '#111'
    const count = Math.min(12000, Math.round(width * height / 450 * settings.grain / 30))
    let seed = frame * 9301 + 49297
    for (let index = 0; index < count; index += 1) { seed = (seed * 233280 + 49297) % 233280; const x = seed / 233280 * width; seed = (seed * 233280 + 49297) % 233280; const y = seed / 233280 * height; context.fillRect(x, y, 1 + settings.grain / 45, 1 + settings.grain / 45) }
    context.restore()
  }
  layers.filter(layer => layer.type === 'Text' && layer.visible).forEach(layer => { context.save(); context.globalAlpha = layer.opacity / 100; context.fillStyle = '#fff'; context.shadowColor = '#000'; context.shadowBlur = 10; context.font = `800 ${Math.max(24, Math.round(width / 16))}px Inter, sans-serif`; context.fillText(layer.text || 'NOVA TITLE', width * .12, height * .85); context.restore() })
}

function drawSource(context: CanvasRenderingContext2D, source: CanvasImageSource, sourceWidth: number, sourceHeight: number, width: number, height: number, settings: EditorSettings) {
  const crop = settings.crop / 100
  const sx = sourceWidth * crop; const sy = sourceHeight * crop; const sw = Math.max(1, sourceWidth - sx * 2); const sh = Math.max(1, sourceHeight - sy * 2)
  const rotation = normalizedRotation(settings.rotate); const quarterTurn = rotation === 90 || rotation === 270
  const drawWidth = quarterTurn ? height : width; const drawHeight = quarterTurn ? width : height
  context.save(); context.clearRect(0, 0, width, height); context.filter = editorFilter(settings); context.translate(width / 2, height / 2); context.rotate(rotation * Math.PI / 180); context.scale(settings.flip ? -1 : 1, settings.flipVertical ? -1 : 1)
  if (settings.glow > 0) { context.save(); context.globalAlpha = settings.glow / 90; context.filter = `${editorFilter(settings)} blur(${settings.glow / 2}px)`; context.globalCompositeOperation = 'screen'; context.drawImage(source, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); context.restore() }
  context.drawImage(source, sx, sy, sw, sh, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight); context.restore()
}

const downloadBlob = (blob: Blob, filename: string) => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1200) }

export function ExportStudio({ asset, settings, layers, onClose, onNotice }: Props) {
  const [resolution, setResolution] = useState<Resolution>('source')
  const [format, setFormat] = useState<ImageFormat>('png')
  const [quality, setQuality] = useState(92)
  const [fps, setFps] = useState(30)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Ready to render')
  const cancelled = useRef(false)
  const estimate = useMemo(() => asset?.kind === 'video' ? `${Math.max(8, Math.round(quality / 7))}–${Math.max(14, Math.round(quality / 3))} MB/min` : `${quality > 90 ? '12–28' : '4–14'} MB`, [asset, quality])

  const exportImage = async () => {
    if (!asset) return
    const image = new Image(); image.src = asset.url
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Image source could not be decoded.')) })
    const size = targetSize(image.naturalWidth, image.naturalHeight, resolution, settings)
    const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas export is unavailable.')
    setStatus('Rendering color and VFX…'); setProgress(35); drawSource(context, image, image.naturalWidth, image.naturalHeight, size.width, size.height, settings); drawFinishing(context, size.width, size.height, settings, layers)
    setStatus('Encoding master image…'); setProgress(78)
    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality / 100)); if (!blob) throw new Error('The image encoder returned no data.')
    downloadBlob(blob, `nova-${asset.name.replace(/\.[^.]+$/, '')}.${format === 'jpeg' ? 'jpg' : format}`)
  }

  const exportVideo = async () => {
    if (!asset) return
    const video = document.createElement('video') as CaptureVideo; video.src = asset.url; video.preload = 'auto'; video.playsInline = true; video.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error('Video source could not be decoded.')) })
    const size = targetSize(video.videoWidth, video.videoHeight, resolution, settings)
    const canvas = document.createElement('canvas'); canvas.width = size.width; canvas.height = size.height
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas export is unavailable.')
    const stream = canvas.captureStream(fps)
    let audioContext: AudioContext | null = null
    let audioGain: GainNode | null = null
    if (includeAudio) {
      try {
        audioContext = new AudioContext(); const source = audioContext.createMediaElementSource(video); audioGain = audioContext.createGain(); audioGain.gain.value = Math.min(1.5, settings.volume / 100)
        const destination = audioContext.createMediaStreamDestination(); const panner = audioContext.createStereoPanner(); panner.pan.value = settings.audioPan / 100; source.connect(audioGain).connect(panner).connect(destination); destination.stream.getAudioTracks().forEach(track => stream.addTrack(track)); await audioContext.resume()
      } catch { const sourceStream = video.captureStream?.() ?? video.mozCaptureStream?.(); sourceStream?.getAudioTracks().forEach(track => stream.addTrack(track)) }
    }
    const mimeCandidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    const mimeType = mimeCandidates.find(candidate => MediaRecorder.isTypeSupported(candidate)) ?? ''
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: resolution === '2160' ? 28_000_000 : resolution === '1080' ? 12_000_000 : 9_000_000, audioBitsPerSecond: 256_000 })
    const chunks: BlobPart[] = []; recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    const complete = new Promise<Blob>(resolve => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || 'video/webm' })) })
    cancelled.current = false; video.currentTime = 0; video.playbackRate = settings.speed; recorder.start(500); await video.play()
    setStatus('Rendering video in real time…')
    let frame = 0
    await new Promise<void>(resolve => {
      const render = () => {
        if (cancelled.current || video.ended) { video.pause(); if (recorder.state !== 'inactive') recorder.stop(); resolve(); return }
        drawSource(context, video, video.videoWidth, video.videoHeight, size.width, size.height, settings); drawFinishing(context, size.width, size.height, settings, layers, frame++)
        if (audioGain) { const fadeIn = settings.fadeIn > 0 ? Math.min(1, video.currentTime / settings.fadeIn) : 1; const remaining = video.duration - video.currentTime; const fadeOut = settings.fadeOut > 0 ? Math.min(1, remaining / settings.fadeOut) : 1; audioGain.gain.value = Math.min(1.5, settings.volume / 100) * Math.min(fadeIn, fadeOut) }
        setProgress(Math.min(99, Math.round(video.currentTime / Math.max(.1, video.duration) * 100))); requestAnimationFrame(render)
      }
      requestAnimationFrame(render)
    })
    const blob = await complete; await audioContext?.close(); if (!cancelled.current) downloadBlob(blob, `nova-${asset.name.replace(/\.[^.]+$/, '')}-master.webm`)
  }

  const startExport = async () => {
    if (!asset) { onNotice('Import and select media before exporting.'); return }
    setExporting(true); setProgress(4); setStatus('Preparing render pipeline…')
    try { if (asset.kind === 'image') await exportImage(); else await exportVideo(); if (!cancelled.current) { setProgress(100); setStatus('Master export complete'); onNotice('High-quality master exported with active edits.') } }
    catch (error) { setStatus('Export interrupted'); onNotice(error instanceof Error ? error.message : 'Export failed.') }
    finally { setExporting(false) }
  }

  const cancel = () => { cancelled.current = true; setStatus('Cancelling render…') }

  return <div className="export-backdrop" role="dialog" aria-modal="true" aria-label="Export studio">
    <section className="export-studio">
      <header><div><span><MonitorUp size={16}/></span><div><small>DELIVER</small><b>Export master</b></div></div><button onClick={exporting ? cancel : onClose}><X size={17}/></button></header>
      <div className="export-layout"><main>
        <div className="export-source"><i>{asset?.kind === 'video' ? <Film size={20}/> : <ImageIcon size={20}/>}</i><div><small>ACTIVE SEQUENCE</small><b>{asset?.name ?? 'No media selected'}</b><span>{asset ? `${asset.kind === 'video' ? 'Video sequence' : 'Still image'} · graded · VFX included` : 'Choose media in the project bin'}</span></div><Check size={15}/></div>
        <section><div className="export-section-title"><span>FORMAT</span><small>MASTER</small></div>{asset?.kind === 'video' ? <div className="format-choice single"><button className="active"><Film size={16}/><span><b>WebM</b><small>VP9 / Opus master</small></span><Check size={13}/></button></div> : <div className="format-choice">{(['png','jpeg','webp'] as ImageFormat[]).map(value => <button key={value} className={format === value ? 'active' : ''} onClick={() => setFormat(value)}><ImageIcon size={15}/><span><b>{value.toUpperCase()}</b><small>{value === 'png' ? 'Lossless' : value === 'jpeg' ? 'Universal' : 'Modern'}</small></span>{format === value && <Check size={12}/>}</button>)}</div>}</section>
        <section><div className="export-section-title"><span>RESOLUTION</span><small>COLOR MANAGED</small></div><div className="export-select"><select value={resolution} onChange={event => setResolution(event.target.value as Resolution)}><option value="source">Match source resolution</option><option value="1080">Full HD · 1080p</option><option value="2160">Ultra HD · 4K</option></select><ChevronDown size={14}/></div></section>
        {(asset?.kind === 'video' || format !== 'png') && <section className="quality-section"><div className="export-section-title"><span>QUALITY</span><output>{quality}%</output></div><input type="range" min="45" max="100" value={quality} onChange={event => setQuality(Number(event.target.value))}/><div><span>Smaller file</span><span>Visually lossless</span></div></section>}
        {asset?.kind === 'video' && <section className="video-export-options"><label><span>Frame rate</span><select value={fps} onChange={event => setFps(Number(event.target.value))}><option value="24">24 fps</option><option value="30">30 fps</option><option value="60">60 fps</option></select></label><label className="export-toggle"><span><b>Include mastered audio</b><small>256 kbps Opus</small></span><input type="checkbox" checked={includeAudio} onChange={event => setIncludeAudio(event.target.checked)}/><i/></label></section>}
      </main><aside>
        <div className="export-summary"><div><Sparkles size={14}/><b>Render summary</b></div><span><small>Container</small>{asset?.kind === 'video' ? 'WebM master' : format.toUpperCase()}</span><span><small>Resolution</small>{resolution === 'source' ? 'Source' : resolution === '2160' ? '3840 × 2160 target' : '1920 × 1080 target'}</span><span><small>Color</small>Nova grade + VFX</span><span><small>Estimated size</small>{estimate}</span></div>
        <div className="export-safe"><ShieldCheck size={15}/><span><b>Local render</b><small>Your media never leaves this browser.</small></span></div>
      </aside></div>
      <footer><div className="export-progress"><div><span>{status}</span><b>{progress}%</b></div><i><em style={{ width: `${progress}%` }}/></i></div><button className="export-cancel" onClick={exporting ? cancel : onClose}>{exporting ? 'Cancel' : 'Close'}</button><button className="export-start" onClick={() => void startExport()} disabled={exporting || !asset}>{exporting ? <LoaderCircle className="spin" size={15}/> : <Download size={15}/>} {exporting ? 'Rendering…' : 'Export master'}</button></footer>
    </section>
  </div>
}
