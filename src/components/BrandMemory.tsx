import { useEffect, useState } from 'react'
import { BookOpen, Save } from 'lucide-react'
import { emptyBrandMemory, loadBrandMemory, saveBrandMemory, type BrandMemoryProfile } from '../lib/brandMemory'
import './BrandMemory.css'

export default function BrandMemory() {
  const [profile, setProfile] = useState<BrandMemoryProfile>(emptyBrandMemory)
  const [notice, setNotice] = useState('')
  useEffect(() => setProfile(loadBrandMemory()), [])
  const update = (key: keyof BrandMemoryProfile, value: string) => setProfile(current => ({ ...current, [key]: value }))
  const fields: Array<[keyof BrandMemoryProfile, string, string]> = [
    ['brandName','Brand name','Name used in listings and creative assets'],
    ['voice','Brand voice','e.g. confident, warm, minimal; words to use or avoid'],
    ['audience','Target audience','Who the product is for and their needs'],
    ['palette','Approved colour palette','Hex codes or descriptive colour names'],
    ['typography','Typography rules','Approved font families and hierarchy'],
    ['imageStyle','Visual direction','Lighting, backgrounds, framing, composition and model rules'],
    ['prohibitedClaims','Prohibited claims','Claims, phrases, guarantees or visual treatments that must not appear'],
    ['approvedExamples','Approved examples / references','Describe approved campaigns or paste internal reference names (no public URLs required)']
  ]
  return <section className="brand-memory">
    <div className="brand-memory-heading"><div><span className="catalog-kicker">WORKSPACE GUIDELINES</span><h2><BookOpen size={21}/> Brand Memory</h2><p>One local brand guide that keeps future content consistent. These rules are guidance—not automatic legal or policy approval.</p></div><span className="brand-local-tag">PRIVATE · THIS DEVICE</span></div>
    <div className="brand-memory-grid">{fields.map(([key,label,hint]) => <label key={key}><span>{label}</span><small>{hint}</small><textarea rows={key === 'brandName' ? 1 : 3} value={String(profile[key] ?? '')} onChange={event => update(key,event.target.value)} /></label>)}</div>
    <div className="brand-memory-footer"><span>{profile.updatedAt ? `Last saved: ${new Date(profile.updatedAt).toLocaleString()}` : 'Not saved yet'}</span><button onClick={() => { try { saveBrandMemory(profile); setNotice('Brand Memory saved on this device.') } catch { setNotice('Could not save. Check browser storage availability.') } }}><Save size={15}/> Save Brand Memory</button>{notice && <small role="status">{notice}</small>}</div>
  </section>
}
