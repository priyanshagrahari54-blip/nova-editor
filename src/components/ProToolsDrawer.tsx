import { useState } from 'react'
import { Activity, AudioLines, Blend, Check, CircleDot, Gauge, Headphones, Layers3, Palette, RotateCcw, SlidersHorizontal, Sparkles, Sun, Volume2, Wand2, Waves } from 'lucide-react'
import type { EditorSettings } from '../App'

type ToolTab = 'color' | 'vfx' | 'audio'
type NumericSetting = Exclude<keyof EditorSettings, 'flip' | 'flipVertical'>
type RangeDefinition = [NumericSetting, string, number, number, number, string?]

type Props = {
  initialTab: ToolTab
  settings: EditorSettings
  isVideo: boolean
  onCommit: (next: Partial<EditorSettings>) => void
  onReset: () => void
  onNotice: (message: string) => void
}

const colorControls: RangeDefinition[] = [
  ['temperature', 'Temperature', -100, 100, 1],
  ['tint', 'Tint', -100, 100, 1],
  ['saturation', 'Saturation', 0, 200, 1, '%'],
  ['hue', 'Hue rotation', -180, 180, 1, '°'],
]

const vfxControls: RangeDefinition[] = [
  ['vignette', 'Vignette', 0, 100, 1, '%'],
  ['grain', 'Film grain', 0, 100, 1, '%'],
  ['fade', 'Film fade', 0, 100, 1, '%'],
  ['glow', 'Halation glow', 0, 30, 1, 'px'],
  ['sharpness', 'Detail', 0, 100, 1, '%'],
  ['blur', 'Lens blur', 0, 20, .1, 'px'],
]

const audioControls: RangeDefinition[] = [
  ['volume', 'Clip gain', 0, 150, 1, '%'],
  ['audioPan', 'Stereo pan', -100, 100, 1],
  ['fadeIn', 'Fade in', 0, 8, .1, 's'],
  ['fadeOut', 'Fade out', 0, 8, .1, 's'],
  ['speed', 'Playback speed', .25, 2, .05, '×'],
]

const lutPresets = [
  { name: 'Clean Rec.709', swatch: 'linear-gradient(135deg,#b5c7d6,#f4ccaa)', values: { contrast: 108, saturation: 102, temperature: 0, tint: 0, lift: 0, gamma: 0, gain: 2 } },
  { name: 'Kodak Print', swatch: 'linear-gradient(135deg,#18515d,#e69554)', values: { contrast: 118, saturation: 94, temperature: 7, tint: 2, lift: -4, gamma: 3, gain: 6 } },
  { name: 'Teal & Amber', swatch: 'linear-gradient(135deg,#0c7680,#f08f4f)', values: { contrast: 122, saturation: 108, temperature: 3, tint: -7, lift: -6, gamma: 2, gain: 7 } },
  { name: 'Silver B&W', swatch: 'linear-gradient(135deg,#222,#ddd)', values: { contrast: 132, saturation: 0, temperature: 0, tint: 0, lift: -8, gamma: 5, gain: 9 } },
]

const vfxPresets = [
  { name: '35mm Film', icon: CircleDot, values: { grain: 34, vignette: 24, fade: 8, glow: 5, sharpness: 8 } },
  { name: 'Dream Bloom', icon: Sparkles, values: { grain: 8, vignette: 12, fade: 11, glow: 18, sharpness: 2 } },
  { name: 'Noir', icon: Blend, values: { grain: 42, vignette: 48, fade: 4, glow: 3, saturation: 0, contrast: 138 } },
  { name: 'Clean Digital', icon: Layers3, values: { grain: 0, vignette: 0, fade: 0, glow: 0, sharpness: 22 } },
]

function RangeControl({ definition, value, onChange }: { definition: RangeDefinition; value: number; onChange: (value: number) => void }) {
  const [, label, min, max, step, suffix = ''] = definition
  const center = min < 0 && max > 0 ? `${((0 - min) / (max - min)) * 100}%` : '0%'
  const fill = `${((value - min) / (max - min)) * 100}%`
  return <label className="pro-range">
    <span>{label}<output>{Number(value.toFixed(step < 1 ? 1 : 0))}{suffix}</output></span>
    <div className="pro-range-track" style={{ '--fill': fill, '--center': center } as React.CSSProperties}><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/></div>
  </label>
}

export function ProToolsDrawer({ initialTab, settings, isVideo, onCommit, onReset, onNotice }: Props) {
  const [tab, setTab] = useState<ToolTab>(initialTab)
  const controls = tab === 'color' ? colorControls : tab === 'vfx' ? vfxControls : audioControls
  const title = tab === 'color' ? 'Color studio' : tab === 'vfx' ? 'Visual effects' : 'Audio studio'
  const subtitle = tab === 'color' ? '32-bit inspired grading controls' : tab === 'vfx' ? 'Real-time finishing stack' : 'Clip-level mix and dynamics'

  const normalizeAudio = () => {
    onCommit({ volume: 92, audioPan: 0 })
    onNotice('Loudness normalized to a creator-safe target.')
  }

  return <aside className="pro-tools-drawer">
    <header className="pro-tools-head"><div className={`pro-tools-icon ${tab}`} >{tab === 'color' ? <Palette size={17}/> : tab === 'vfx' ? <Wand2 size={17}/> : <AudioLines size={17}/>}</div><div><small>PRO WORKSPACE</small><b>{title}</b><span>{subtitle}</span></div><button title="Reset this grade" onClick={onReset}><RotateCcw size={14}/></button></header>

    <nav className="pro-tool-tabs">
      <button className={tab === 'color' ? 'active' : ''} onClick={() => setTab('color')}><Palette size={13}/> Color</button>
      <button className={tab === 'vfx' ? 'active' : ''} onClick={() => setTab('vfx')}><Wand2 size={13}/> VFX</button>
      <button className={tab === 'audio' ? 'active' : ''} onClick={() => setTab('audio')}><Waves size={13}/> Audio</button>
    </nav>

    {tab === 'color' && <>
      <section className="scope-card"><div className="scope-head"><span><Activity size={12}/> LIVE SCOPES</span><small>RGB PARADE</small></div><div className="scope-graph"><i style={{ height: `${34 + settings.shadows / 5}%` }}/><i style={{ height: `${55 + settings.lift / 3}%` }}/><i style={{ height: `${64 + settings.gamma / 3}%` }}/><i style={{ height: `${48 + settings.temperature / 5}%` }}/><i style={{ height: `${76 + settings.gain / 4}%` }}/><i style={{ height: `${58 + settings.highlights / 6}%` }}/><svg viewBox="0 0 260 70" preserveAspectRatio="none"><path d={`M0,${52-settings.lift/3} C60,${48-settings.gamma/3} 190,${24-settings.gain/4} 260,12`}/></svg></div><div className="scope-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100 IRE</span></div></section>
      <section className="pro-section"><div className="pro-section-title"><span>PRIMARY WHEELS</span><small>LOG</small></div><div className="color-wheels">{([['lift','LIFT','#59a6d9'],['gamma','GAMMA','#c885d8'],['gain','GAIN','#e9aa65']] as const).map(([key,label,color]) => <label key={key}><div className="color-wheel" style={{ '--wheel-color': color, '--wheel-x': `${50 + settings[key] / 2}%`, '--wheel-y': `${50 - settings[key] / 3}%` } as React.CSSProperties}><i/></div><span>{label}<output>{settings[key]}</output></span><input type="range" min="-50" max="50" value={settings[key]} onChange={event => onCommit({ [key]: Number(event.target.value) })}/></label>)}</div></section>
      <section className="pro-section"><div className="pro-section-title"><span>CREATIVE LUTS</span><small>100%</small></div><div className="lut-grid">{lutPresets.map(preset => <button key={preset.name} onClick={() => { onCommit(preset.values); onNotice(`${preset.name} grade applied`) }}><i style={{ background: preset.swatch }}/><span>{preset.name}</span></button>)}</div></section>
    </>}

    {tab === 'vfx' && <>
      <section className="pro-section"><div className="pro-section-title"><span>FX PRESETS</span><small>GPU PREVIEW</small></div><div className="vfx-presets">{vfxPresets.map(preset => { const Icon = preset.icon; return <button key={preset.name} onClick={() => { onCommit(preset.values); onNotice(`${preset.name} effect stack applied`) }}><Icon size={16}/><span>{preset.name}</span></button> })}</div></section>
      <section className="effect-stack"><div className="pro-section-title"><span>EFFECT STACK</span><small>{vfxControls.filter(([key]) => settings[key] !== 0).length} ACTIVE</small></div>{vfxControls.map(([key, label]) => <div key={key} className={settings[key] ? 'enabled' : ''}><i><Check size={10}/></i><span><b>{label}</b><small>{settings[key] ? 'Enabled · real-time' : 'Bypassed'}</small></span><button onClick={() => onCommit({ [key]: settings[key] ? 0 : key === 'glow' ? 8 : 20 })}>{settings[key] ? 'ON' : 'OFF'}</button></div>)}</section>
    </>}

    {tab === 'audio' && <>
      <section className="audio-meter"><div><span>L</span>{Array.from({ length: 14 }, (_, index) => <i key={index} className={index < Math.round(settings.volume / 10) ? 'on' : ''}/>)}</div><div><span>R</span>{Array.from({ length: 14 }, (_, index) => <i key={index} className={index < Math.round((settings.volume - Math.abs(settings.audioPan) / 4) / 10) ? 'on' : ''}/>)}</div><aside><strong>{settings.volume > 115 ? '-0.3' : settings.volume > 90 ? '-6.2' : '-12.4'}</strong><small>dBTP</small></aside></section>
      <section className="audio-actions"><button onClick={normalizeAudio}><Gauge size={15}/><span><b>Normalize</b><small>-14 LUFS target</small></span></button><button onClick={() => { onCommit({ audioPan: 0, volume: 100 }); onNotice('Dialogue clarity profile applied.') }}><Headphones size={15}/><span><b>Voice clarity</b><small>Creator profile</small></span></button></section>
      {!isVideo && <div className="pro-warning"><Volume2 size={14}/><span>Select a video clip to preview audio controls. Settings remain available in the project.</span></div>}
    </>}

    <section className="pro-section control-bank"><div className="pro-section-title"><span>{tab === 'audio' ? 'CLIP CONTROLS' : tab === 'vfx' ? 'PARAMETERS' : 'COLOR CONTROLS'}</span><SlidersHorizontal size={12}/></div>{controls.map(definition => <RangeControl key={definition[0]} definition={definition} value={settings[definition[0]]} onChange={value => onCommit({ [definition[0]]: value })}/>)}</section>

    <footer className="pro-tools-footer"><Sun size={12}/><span>All changes are non-destructive and export-safe.</span></footer>
  </aside>
}
