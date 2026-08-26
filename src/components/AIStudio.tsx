import { useState } from 'react'
import { Box, Check, ChevronRight, Clock3, Cloud, Eraser, Film, Focus, Gauge, Image as ImageIcon, LoaderCircle, Maximize2, Moon, ScanLine, ShieldCheck, Sparkles, Subtitles, Sun, UserRound, Wand2, Zap } from 'lucide-react'
import { createPlan, createPowerfulPlan, NOVA_AI_MODEL, type AiPlan } from '../lib/ai'
import type { EditorSettings } from '../App'

type Asset = { name: string; kind: 'image' | 'video'; url: string }
type NumericSetting = 'exposure' | 'brightness' | 'contrast' | 'highlights' | 'shadows' | 'temperature' | 'tint' | 'saturation' | 'sharpness' | 'blur' | 'crop'
type Recipe = {
  id: string
  name: string
  label: string
  description: string
  icon: typeof Film
  target: Partial<Record<NumericSetting, number>>
}
type Analysis = { dimensions: string; exposure: string; range: string; color: string; score: number; issues: string[]; correction: Partial<EditorSettings> }
type Run = { id: string; name: string; strength: number; time: string }

type Props = {
  asset: Asset | null
  settings: EditorSettings
  preserve: string[]
  onPreserveChange: (items: string[]) => void
  onApply: (name: string, next: Partial<EditorSettings>) => void
  onOpenMedia: () => void
  onNotice: (message: string) => void
}

const recipes: Recipe[] = [
  { id: 'balanced', name: 'Creator clean', label: 'AUTO', description: 'Neutral contrast, recovered detail', icon: Sparkles, target: { brightness: 103, contrast: 108, highlights: -14, shadows: 14, temperature: 1, saturation: 104, sharpness: 10 } },
  { id: 'cinematic', name: 'Cinematic 02', label: 'FILM', description: 'Cool shadows, soft highlights', icon: Film, target: { brightness: 97, contrast: 119, highlights: -24, shadows: 10, temperature: -7, tint: -3, saturation: 90, sharpness: 12 } },
  { id: 'portrait', name: 'Portrait light', label: 'SKIN', description: 'Warm, open and natural', icon: UserRound, target: { brightness: 106, contrast: 105, highlights: -17, shadows: 20, temperature: 7, tint: 3, saturation: 101, sharpness: 7 } },
  { id: 'product', name: 'Product polish', label: 'STUDIO', description: 'Crisp whites and clean color', icon: Box, target: { brightness: 109, contrast: 114, highlights: -10, shadows: 8, temperature: 0, tint: 0, saturation: 106, sharpness: 19 } },
  { id: 'social', name: 'Social punch', label: 'FEED', description: 'High-impact creator color', icon: Zap, target: { brightness: 103, contrast: 123, highlights: -13, shadows: 11, temperature: 4, saturation: 119, sharpness: 16 } },
  { id: 'night', name: 'Night recovery', label: 'LOW LIGHT', description: 'Lift shadows, control noise', icon: Moon, target: { brightness: 111, contrast: 109, highlights: -34, shadows: 31, temperature: -5, tint: 4, saturation: 108, sharpness: 6 } },
]

const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms))

function blendTarget(settings: EditorSettings, target: Recipe['target'], strength: number) {
  const ratio = strength / 100
  const next: Partial<EditorSettings> = {}
  ;(Object.keys(target) as NumericSetting[]).forEach(key => {
    const goal = target[key]
    if (goal === undefined) return
    next[key] = Math.round((settings[key] + (goal - settings[key]) * ratio) * 10) / 10
  })
  return next
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function inspectPixels(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, dimensions: string): Analysis {
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 220 / Math.max(sourceWidth, sourceHeight))
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas analysis is unavailable.')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let light = 0
  let lightSquared = 0
  let saturation = 0
  let warmth = 0
  let samples = 0
  for (let index = 0; index < pixels.length; index += 16) {
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    const luminance = red * .2126 + green * .7152 + blue * .0722
    const max = Math.max(red, green, blue)
    const min = Math.min(red, green, blue)
    light += luminance
    lightSquared += luminance * luminance
    saturation += max ? (max - min) / max : 0
    warmth += red - blue
    samples += 1
  }
  const average = light / samples
  const deviation = Math.sqrt(Math.max(0, lightSquared / samples - average * average))
  const colorAmount = saturation / samples
  const warmBias = warmth / samples
  const exposure = average < 82 ? 'Low-key' : average > 184 ? 'High-key' : 'Balanced'
  const range = deviation > 67 ? 'High contrast' : deviation < 39 ? 'Soft range' : 'Full range'
  const color = colorAmount < .13 ? 'Muted color' : warmBias > 12 ? 'Warm bias' : warmBias < -12 ? 'Cool bias' : 'Neutral color'
  const score = Math.max(72, Math.min(97, Math.round(90 - Math.abs(128 - average) / 8 + Math.min(6, deviation / 12))))
  const issues = [
    average < 95 ? 'Lift low exposure' : average > 174 ? 'Recover highlight detail' : 'Exposure is well placed',
    deviation < 39 ? 'Add tonal separation' : deviation > 70 ? 'Soften hard contrast' : 'Dynamic range is balanced',
    colorAmount < .13 ? 'Restore restrained color' : Math.abs(warmBias) > 12 ? 'Neutralize color cast' : 'White balance is neutral',
  ]
  const correction: Partial<EditorSettings> = {
    exposure: Math.round(clamp((128 - average) * .22, -24, 24)),
    contrast: Math.round(clamp(100 + (53 - deviation) * .34, 88, 120)),
    highlights: Math.round(clamp(12 - Math.max(0, average - 125) * .45, -32, 8)),
    shadows: Math.round(clamp(8 + Math.max(0, 120 - average) * .3, 5, 30)),
    temperature: Math.round(clamp(-warmBias * .34, -18, 18)),
    saturation: Math.round(clamp(100 + (.27 - colorAmount) * 58, 90, 119)),
    sharpness: Math.round(clamp(15 - deviation / 8, 6, 13)),
  }
  return { dimensions, exposure, range, color, score, issues, correction }
}

async function inspectImage(asset: Asset): Promise<Analysis> {
  if (asset.kind === 'video') {
    const video = document.createElement('video')
    video.preload = 'auto'; video.muted = true; video.playsInline = true; video.src = asset.url
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error('Video frame could not be analyzed.'))
    })
    return inspectPixels(video, video.videoWidth, video.videoHeight, `${video.videoWidth} × ${video.videoHeight}`)
  }

  const image = new Image()
  image.src = asset.url
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Image could not be analyzed.'))
  })
  return inspectPixels(image, image.naturalWidth, image.naturalHeight, `${image.naturalWidth} × ${image.naturalHeight}`)
}

export function AIStudio({ asset, settings, preserve, onPreserveChange, onApply, onOpenMedia, onNotice }: Props) {
  const [mode, setMode] = useState<'looks' | 'retouch' | 'generate'>('looks')
  const [selectedRecipe, setSelectedRecipe] = useState('balanced')
  const [strength, setStrength] = useState(72)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [plan, setPlan] = useState<AiPlan | null>(null)
  const [planning, setPlanning] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])

  const activeRecipe = recipes.find(recipe => recipe.id === selectedRecipe) ?? recipes[0]

  const analyze = async () => {
    if (!asset) { onOpenMedia(); return }
    setAnalyzing(true)
    try {
      await sleep(350)
      setAnalysis(await inspectImage(asset))
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'Media analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const applyRecipe = async (recipe = activeRecipe) => {
    if (!asset) { onOpenMedia(); return }
    setApplying(true)
    await sleep(520)
    onApply(recipe.name, blendTarget(settings, recipe.target, strength))
    setRuns(items => [{ id: crypto.randomUUID(), name: recipe.name, strength, time: 'Just now' }, ...items].slice(0, 4))
    setApplying(false)
  }

  const applyAnalysis = async () => {
    if (!analysis) return
    setApplying(true)
    await sleep(420)
    onApply('Source-aware correction', analysis.correction)
    setRuns(items => [{ id: crypto.randomUUID(), name: 'Source-aware correction', strength: 100, time: 'Just now' }, ...items].slice(0, 4))
    setApplying(false)
  }

  const applyTool = (recipeId: string) => {
    const recipe = recipes.find(item => item.id === recipeId) ?? recipes[0]
    setSelectedRecipe(recipe.id)
    void applyRecipe(recipe)
  }

  const buildPlan = async () => {
    if (!prompt.trim()) { onNotice('Describe the edit you want Nova to plan.'); return }
    setPlanning(true)
    try {
      setPlan(await createPowerfulPlan({ operation: asset?.kind === 'video' ? 'editVideo' : 'editImage', prompt, preserve, assetName: asset?.name }))
      onNotice(`${NOVA_AI_MODEL} created an editable production plan.`)
    } catch (error) {
      setPlan(createPlan(prompt, preserve))
      onNotice(error instanceof Error ? `${error.message} Using Nova's local planner.` : "Using Nova's local planner.")
    } finally {
      setPlanning(false)
    }
  }

  const togglePreserve = (item: string) => onPreserveChange(preserve.includes(item) ? preserve.filter(value => value !== item) : [...preserve, item])

  return <div className="ai-studio">
    <div className="ai-hero">
      <div className="ai-hero-icon"><Wand2 size={17}/></div>
      <div><span>CREATIVE COPILOT</span><b>Studio intelligence</b></div>
      <em><i/>LOCAL</em>
    </div>

    <div className="ai-source">
      <div className="ai-source-thumb">{asset?.kind === 'image' ? <img src={asset.url} alt=""/> : asset?.kind === 'video' ? <Film size={18}/> : <ImageIcon size={18}/>}</div>
      <div><small>ACTIVE SOURCE</small><b>{asset?.name ?? 'No media selected'}</b><span>{asset ? `${asset.kind} · ready to analyze` : 'Import a source to begin'}</span></div>
      <button title="Analyze source" onClick={() => void analyze()} disabled={analyzing}>{analyzing ? <LoaderCircle className="spin" size={15}/> : <ScanLine size={15}/>}</button>
    </div>

    {analysis ? <div className="ai-analysis-result"><div className="ai-analysis">
      <div className="analysis-score"><strong>{analysis.score}</strong><span>QUALITY<br/>SIGNAL</span></div>
      <div className="analysis-grid"><span><small>FRAME</small>{analysis.dimensions}</span><span><small>LIGHT</small>{analysis.exposure}</span><span><small>RANGE</small>{analysis.range}</span><span><small>COLOR</small>{analysis.color}</span></div>
    </div><div className="analysis-findings">{analysis.issues.map((issue, index) => <span key={issue} className={index === 0 && analysis.score < 85 ? 'attention' : ''}><i>{index + 1}</i>{issue}</span>)}<button onClick={() => void applyAnalysis()} disabled={applying}>{applying ? <LoaderCircle className="spin" size={13}/> : <Sparkles size={13}/>} Apply analyzed correction</button></div></div> : <button className="analyze-cta" onClick={() => void analyze()} disabled={analyzing}>{analyzing ? <LoaderCircle className="spin" size={15}/> : <Gauge size={15}/>} {analyzing ? 'Reading source pixels…' : 'Analyze creative quality'}<ChevronRight size={14}/></button>}

    <div className="ai-mode-tabs">
      <button className={mode === 'looks' ? 'active' : ''} onClick={() => setMode('looks')}>Smart looks</button>
      <button className={mode === 'retouch' ? 'active' : ''} onClick={() => setMode('retouch')}>Retouch</button>
      <button className={mode === 'generate' ? 'active' : ''} onClick={() => setMode('generate')}>Generate</button>
    </div>

    {mode === 'looks' && <div className="ai-mode-content">
      <div className="ai-section-label"><span>DIRECTED LOOKS</span><small>NON-DESTRUCTIVE</small></div>
      <div className="recipe-list">{recipes.map(recipe => { const Icon = recipe.icon; return <button key={recipe.id} className={selectedRecipe === recipe.id ? 'active' : ''} onClick={() => setSelectedRecipe(recipe.id)}><i><Icon size={15}/></i><span><small>{recipe.label}</small><b>{recipe.name}</b><em>{recipe.description}</em></span>{selectedRecipe === recipe.id && <Check size={14}/>}</button> })}</div>
      <label className="ai-strength"><span>Look strength <output>{strength}%</output></span><input type="range" min="10" max="100" value={strength} onChange={event => setStrength(Number(event.target.value))}/></label>
      <button className="ai-run-button" onClick={() => void applyRecipe()} disabled={applying}>{applying ? <LoaderCircle className="spin" size={15}/> : <Sparkles size={15}/>} {applying ? 'Building editable look…' : `Apply ${activeRecipe.name}`}</button>
    </div>}

    {mode === 'retouch' && <div className="ai-mode-content">
      <div className="ai-section-label"><span>PRECISION ASSISTS</span><small>EDITABLE</small></div>
      <div className="retouch-list">
        <button onClick={() => applyTool('balanced')}><i><Sun size={15}/></i><span><b>Auto balance</b><small>Recover light and neutral color</small></span><ChevronRight size={14}/></button>
        <button onClick={() => applyTool('portrait')}><i><UserRound size={15}/></i><span><b>Face light</b><small>Open shadows while protecting skin</small></span><ChevronRight size={14}/></button>
        <button onClick={() => applyTool('product')}><i><Focus size={15}/></i><span><b>Detail recovery</b><small>Crisp edges without harshness</small></span><ChevronRight size={14}/></button>
        <button onClick={() => applyTool('night')}><i><Moon size={15}/></i><span><b>Low-light rescue</b><small>Lift the frame and retain mood</small></span><ChevronRight size={14}/></button>
      </div>
      <div className="preserve-box"><div><ShieldCheck size={14}/><span><b>Protected regions</b><small>Direct the edit around key content</small></span></div><div>{['Face', 'Logo', 'Text'].map(item => <button key={item} className={preserve.includes(item) ? 'active' : ''} onClick={() => togglePreserve(item)}>{preserve.includes(item) && <Check size={11}/>} {item}</button>)}</div></div>
    </div>}

    {mode === 'generate' && <div className="ai-mode-content">
      <div className="ai-section-label"><span>DIRECT THE EDIT</span><small>PROVIDER-READY</small></div>
      <div className="ai-model-profile"><i><Sparkles size={14}/></i><span><small>ACTIVE REASONING MODEL</small><b>{NOVA_AI_MODEL}</b><em>HIGH EFFORT</em></span><Check size={13}/></div>
      <textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Make this feel like a premium launch film. Keep the face and logo unchanged."/>
      <div className="prompt-chips"><button onClick={() => setPrompt('Create a premium cinematic grade with controlled highlights')}>Cinematic</button><button onClick={() => setPrompt('Make the subject pop while keeping skin natural')}>Subject pop</button><button onClick={() => setPrompt('Build a clean high-converting product look')}>Product</button></div>
      <button className="ai-run-button" onClick={() => void buildPlan()} disabled={planning}>{planning ? <LoaderCircle className="spin" size={15}/> : <Wand2 size={15}/>} {planning ? `Reasoning with ${NOVA_AI_MODEL}…` : 'Build editable plan'}</button>
      {plan && <div className="ai-plan"><div><Sparkles size={14}/><b>{plan.title}</b></div>{plan.summary && <p>{plan.summary}</p>}{plan.steps.map((step, index) => <span key={step}><i>{index + 1}</i>{step}</span>)}<small>{plan.source === 'cloud' ? <><Check size={12}/>{plan.model} reasoning complete</> : <><Cloud size={12}/>Configure OPENAI_API_KEY to use {NOVA_AI_MODEL}</>}</small></div>}
      <div className="cloud-tools">
        <button onClick={() => onNotice('Generative erase is provider-ready. Connect a secure image model to enable it.')}><Eraser size={15}/><span><b>Generative erase</b><small>Remove or replace objects</small></span></button>
        <button onClick={() => onNotice('Generative expand is provider-ready. Connect a secure image model to enable it.')}><Maximize2 size={15}/><span><b>Generative expand</b><small>Reframe for any channel</small></span></button>
        <button onClick={() => onNotice('Auto captions are provider-ready. Connect a transcription provider to enable them.')}><Subtitles size={15}/><span><b>Auto captions</b><small>Transcript and style system</small></span></button>
      </div>
    </div>}

    {runs.length > 0 && <div className="ai-runs"><div className="ai-section-label"><span>VERSIONS</span><small>{runs.length} RUN{runs.length > 1 ? 'S' : ''}</small></div>{runs.map((run, index) => <div key={run.id}><i>{index + 1}</i><span><b>{run.name}</b><small>{run.strength}% strength · {run.time}</small></span><Check size={13}/></div>)}</div>}

    <div className="ai-footer"><Clock3 size={12}/><span>Every smart look is added to undo history.</span></div>
  </div>
}
