import { useMemo, useRef, useState } from 'react'
import { Copy, Film, Lock, Magnet, Minus, MousePointer2, Music2, Pause, Play, Plus, Scissors, Trash2, Type, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react'

type Clip = { id: string; name: string; start: number; end: number; sourceIn: number; color: string }
type Props = {
  assetName: string
  duration: number
  currentTime: number
  playing: boolean
  onPlayToggle: () => void
  onSeek: (time: number) => void
  onNotice: (message: string) => void
}

const formatTime = (seconds: number) => {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0')
  const secs = Math.floor(safe % 60).toString().padStart(2, '0')
  const frames = Math.floor((safe % 1) * 30).toString().padStart(2, '0')
  return `${minutes}:${secs}:${frames}`
}

export function ProfessionalTimeline({ assetName, duration, currentTime, playing, onPlayToggle, onSeek, onNotice }: Props) {
  const safeDuration = Math.max(duration || 15, 1)
  const [zoom, setZoom] = useState(100)
  const [snapping, setSnapping] = useState(true)
  const [selectedClip, setSelectedClip] = useState('source')
  const [muted, setMuted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [clips, setClips] = useState<Clip[]>([{ id: 'source', name: assetName, start: 0, end: safeDuration, sourceIn: 0, color: '#66508c' }])
  const trackRef = useRef<HTMLDivElement>(null)
  const pixelsPerSecond = Math.max(12, (zoom / 100) * 38)
  const timelineWidth = Math.max(640, safeDuration * pixelsPerSecond)
  const ticks = useMemo(() => Array.from({ length: Math.ceil(safeDuration / (zoom > 140 ? 1 : zoom > 70 ? 2 : 5)) + 1 }, (_, index) => index * (zoom > 140 ? 1 : zoom > 70 ? 2 : 5)), [safeDuration, zoom])

  const seekFromPointer = (clientX: number) => {
    const element = trackRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const scrollParent = element.parentElement
    const offset = clientX - rect.left + (scrollParent?.scrollLeft ?? 0)
    let next = Math.max(0, Math.min(safeDuration, offset / pixelsPerSecond))
    if (snapping) next = Math.round(next * 2) / 2
    onSeek(next)
  }

  const split = () => {
    const clip = clips.find(item => item.id === selectedClip)
    if (!clip || currentTime <= clip.start + .1 || currentTime >= clip.end - .1) { onNotice('Move the playhead inside the selected clip to split.'); return }
    const left: Clip = { ...clip, id: crypto.randomUUID(), end: currentTime, name: `${clip.name} A` }
    const right: Clip = { ...clip, id: crypto.randomUUID(), start: currentTime, sourceIn: clip.sourceIn + currentTime - clip.start, name: `${clip.name} B` }
    setClips(items => items.flatMap(item => item.id === clip.id ? [left, right] : item))
    setSelectedClip(right.id)
    onNotice(`Clip split at ${formatTime(currentTime)}`)
  }

  const duplicate = () => {
    const clip = clips.find(item => item.id === selectedClip)
    if (!clip) return
    const length = clip.end - clip.start
    const start = Math.min(safeDuration - .1, clip.end)
    const copy = { ...clip, id: crypto.randomUUID(), name: `${clip.name} copy`, start, end: Math.min(safeDuration, start + length) }
    setClips(items => [...items, copy])
    setSelectedClip(copy.id)
    onNotice('Clip duplicated on V1.')
  }

  const trim = (amount: number) => {
    setClips(items => items.map(clip => clip.id === selectedClip ? { ...clip, end: Math.max(clip.start + .2, Math.min(safeDuration, clip.end + amount)) } : clip))
  }

  const remove = () => {
    if (clips.length === 1) { onNotice('The primary source clip cannot be removed.'); return }
    setClips(items => items.filter(item => item.id !== selectedClip))
    setSelectedClip(clips.find(item => item.id !== selectedClip)?.id ?? '')
  }

  return <section className="pro-timeline">
    <header className="pro-timeline-toolbar">
      <div className="timeline-brand"><Film size={15}/><b>Timeline</b><span>30 fps</span><strong>{formatTime(currentTime)}</strong></div>
      <div className="edit-tools"><button className="active" title="Selection tool"><MousePointer2 size={13}/></button><button title="Blade tool" onClick={split}><Scissors size={13}/></button><i/><button title="Trim selected clip shorter" onClick={() => trim(-.25)}><Minus size={13}/></button><button title="Trim selected clip longer" onClick={() => trim(.25)}><Plus size={13}/></button><button title="Duplicate clip" onClick={duplicate}><Copy size={13}/></button><button title="Delete clip" onClick={remove}><Trash2 size={13}/></button></div>
      <div className="timeline-view"><button className={snapping ? 'active' : ''} title="Toggle snapping" onClick={() => setSnapping(value => !value)}><Magnet size={13}/></button><ZoomOut size={12}/><input aria-label="Timeline zoom" type="range" min="35" max="240" value={zoom} onChange={event => setZoom(Number(event.target.value))}/><ZoomIn size={12}/><button className="play-control" onClick={onPlayToggle}>{playing ? <Pause size={13}/> : <Play size={13}/>}</button></div>
    </header>
    <div className="timeline-scroll">
      <div className="timeline-canvas" style={{ width: timelineWidth + 104 }}>
        <div className="track-label ruler-label"><span>TC</span></div>
        <div className="pro-ruler" ref={trackRef} style={{ width: timelineWidth }} onPointerDown={event => seekFromPointer(event.clientX)}>{ticks.map(tick => <i key={tick} style={{ left: tick * pixelsPerSecond }}><b>{formatTime(tick).slice(0,5)}</b></i>)}</div>
        <div className="track-label"><b>V1</b><span>VIDEO</span><button onClick={() => setLocked(value => !value)} className={locked ? 'active' : ''}><Lock size={10}/></button></div>
        <div className="pro-track video-track" style={{ width: timelineWidth }} onPointerDown={event => seekFromPointer(event.clientX)}>{clips.map(clip => <button key={clip.id} className={`pro-clip ${selectedClip === clip.id ? 'selected' : ''}`} style={{ left: clip.start * pixelsPerSecond, width: Math.max(20, (clip.end - clip.start) * pixelsPerSecond), '--clip-color': clip.color } as React.CSSProperties} onPointerDown={event => { event.stopPropagation(); setSelectedClip(clip.id); onSeek(clip.start) }}><i/><Film size={11}/><span>{clip.name}</span><small>{formatTime(clip.end - clip.start)}</small><i/></button>)}<div className="timeline-playhead" style={{ left: currentTime * pixelsPerSecond }}><i/></div></div>
        <div className="track-label"><b>T1</b><span>TITLES</span><Type size={10}/></div>
        <div className="pro-track title-track" style={{ width: timelineWidth }}><div className="title-clip" style={{ left: pixelsPerSecond * .5, width: Math.min(180, timelineWidth * .32) }}><Type size={10}/> Graphics / titles</div><div className="timeline-playhead ghost" style={{ left: currentTime * pixelsPerSecond }}/></div>
        <div className="track-label"><b>A1</b><span>AUDIO</span><button onClick={() => setMuted(value => !value)}>{muted ? <VolumeX size={10}/> : <Volume2 size={10}/>}</button></div>
        <div className="pro-track audio-pro-track" style={{ width: timelineWidth }}><div className={`audio-pro-clip ${muted ? 'muted' : ''}`} style={{ width: safeDuration * pixelsPerSecond }}><Music2 size={11}/><span>{Array.from({ length: Math.max(20, Math.floor(safeDuration * 3)) }, (_, index) => <i key={index} style={{ height: `${22 + Math.abs(Math.sin(index * 1.7)) * 60}%` }}/>)}</span></div><div className="timeline-playhead ghost" style={{ left: currentTime * pixelsPerSecond }}/></div>
      </div>
    </div>
  </section>
}
