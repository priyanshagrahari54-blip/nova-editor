import { Check, Crop, Maximize2, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import type { CropAspect } from '../lib/photoGeometry'

const aspects: CropAspect[] = ['free', '1:1', '4:5', '3:2', '16:9', '9:16']

type Props = {
  cropMode: boolean
  cropAspect: CropAspect
  rotation: number
  onRotate180: () => void
  onToggleCrop: () => void
  onApplyCrop: () => void
  onCancelCrop: () => void
  onAspectChange: (aspect: CropAspect) => void
  onResetCrop: () => void
  onRotationStart: () => void
  onRotationChange: (value: number) => void
  onRotationEnd: () => void
  onResetAdjustments: () => void
  onResetTransform: () => void
  onResetAll: () => void
}

export function PhotoTransformControls({ cropMode, cropAspect, rotation, onRotate180, onToggleCrop, onApplyCrop, onCancelCrop, onAspectChange, onResetCrop, onRotationStart, onRotationChange, onRotationEnd, onResetAdjustments, onResetTransform, onResetAll }: Props) {
  const finishRotation = (element: HTMLInputElement) => { onRotationEnd(); element.blur() }
  return <div className="photo-transform-tools">
    <div className="photo-transform-buttons">
      <button onClick={onRotate180}><RotateCcw size={13}/> Rotate 180°</button>
      <button className={cropMode ? 'active' : ''} onClick={onToggleCrop}><Crop size={13}/>{cropMode ? 'Editing crop' : 'Crop'}</button>
      <button onClick={onResetTransform}><Maximize2 size={13}/> Reset transform</button>
      <button onClick={onResetAdjustments}><SlidersHorizontal size={13}/> Reset adjustments</button>
      <button onClick={onResetAll}><RotateCcw size={13}/> Reset all</button>
    </div>
    {cropMode && <div className="crop-options">
      <div><span>ASPECT RATIO</span><button onClick={onResetCrop}>Reset crop</button></div>
      <nav>{aspects.map(aspect => <button key={aspect} className={cropAspect === aspect ? 'active' : ''} onClick={() => onAspectChange(aspect)}>{aspect === 'free' ? 'Free' : aspect}</button>)}</nav>
      <div className="crop-confirm-actions"><button onClick={onCancelCrop}><X size={13}/> Cancel</button><button className="apply-crop" onClick={onApplyCrop}><Check size={13}/> Apply crop</button></div>
    </div>}
    <label className="free-rotation"><span>Free rotation <output>{rotation}°</output></span><input type="range" min="-180" max="180" step="1" value={rotation} onPointerDown={onRotationStart} onPointerUp={event => finishRotation(event.currentTarget)} onPointerCancel={event => finishRotation(event.currentTarget)} onKeyDown={onRotationStart} onKeyUp={event => finishRotation(event.currentTarget)} onBlur={onRotationEnd} onChange={event => onRotationChange(Number(event.target.value))}/></label>
  </div>
}
