import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Trash2, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'
import type { ProductRecord } from '../lib/catalog'
import { getProductImages, saveProductImage, deleteProductImage, type ProductImage } from '../lib/catalogDb'
import './ProductOpsWorkbench.css'

type Props = { products: ProductRecord[] }
type ReviewState = Record<string, 'draft' | 'review' | 'approved'>
const CHANNELS = ['Shopify', 'Amazon (generic draft)', 'Etsy (generic draft)']

export default function ProductOpsWorkbench({ products }: Props) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [selectedSku, setSelectedSku] = useState('')
  const [channel, setChannel] = useState(CHANNELS[0])
  const [market, setMarket] = useState('en-IN')
  const [reviews, setReviews] = useState<ReviewState>({})
  const [notice, setNotice] = useState('Images stay in this browser on this device.')
  const fileRef = useRef<HTMLInputElement>(null)
  const selected = products.find(product => product.sku === selectedSku) ?? products[0]
  const selectedImages = images.filter(image => image.sku === selected?.sku)
  const readiness = useMemo(() => {
    if (!selected) return []
    return [
      { label: 'SKU present', ok: Boolean(selected.sku.trim()) },
      { label: 'Product title present', ok: Boolean(selected.title.trim()) },
      { label: 'Brand and category present', ok: Boolean(selected.brand.trim() && selected.category.trim()) },
      { label: 'Description present', ok: Boolean(selected.description.trim()) },
      { label: 'Price and currency present', ok: Boolean(selected.price.trim() && selected.currency.trim()) },
      { label: 'At least one product image attached', ok: selectedImages.length > 0 },
      { label: 'Colour / material specified', ok: Boolean(selected.color.trim() || selected.material.trim()) },
    ]
  }, [selected, selectedImages.length])
  const passed = readiness.filter(item => item.ok).length

  useEffect(() => {
    getProductImages().then(setImages).catch(() => setNotice('Image storage is unavailable in this browser.'))
    try { setReviews(JSON.parse(localStorage.getItem('nova-review-states-v1') || '{}')) } catch { setReviews({}) }
  }, [])

  const addImages = async (files: FileList | null) => {
    if (!selected || !files?.length) return
    const allowed = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (!allowed.length) { setNotice('Choose image files only.'); return }
    try {
      const added = await Promise.all(allowed.map(file => saveProductImage({ id: crypto.randomUUID(), sku: selected.sku, name: file.name, type: file.type, size: file.size, blob: file, createdAt: Date.now() })))
      setImages(current => [...current, ...added])
      setNotice(added.length + ' image(s) saved locally.')
    } catch { setNotice('Could not save images. Check available browser storage.') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImage = async (image: ProductImage) => {
    try { await deleteProductImage(image.id); setImages(current => current.filter(item => item.id !== image.id)); setNotice('Image removed from this device.') }
    catch { setNotice('Could not remove this image.') }
  }

  const setReview = (value: 'draft' | 'review' | 'approved') => {
    if (!selected) return
    const next = { ...reviews, [selected.sku]: value }
    setReviews(next)
    localStorage.setItem('nova-review-states-v1', JSON.stringify(next))
  }

  const titleDraft = selected ? [selected.brand, selected.title, selected.color].filter(Boolean).join(' · ') : ''
  const descriptionDraft = selected ? [selected.description, selected.material ? 'Material: ' + selected.material : '', selected.color ? 'Colour: ' + selected.color : ''].filter(Boolean).join('\n\n') : ''

  const downloadDraft = () => {
    if (!selected) return
    const body = ['Nova listing draft — human review required', 'Channel preset: ' + channel, 'Market: ' + market, 'SKU: ' + selected.sku, 'Title draft: ' + titleDraft, 'Description draft: ' + descriptionDraft, 'Price: ' + selected.price + ' ' + selected.currency, '', 'This is a generic editable draft, not an official channel template or policy approval.'].join('\n')
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = selected.sku + '-listing-draft.txt'; anchor.click(); URL.revokeObjectURL(url)
  }

  return <section className="ops-workbench">
    <div className="ops-heading"><div><span className="catalog-kicker">CONTENT OPERATIONS</span><h2>Assets, identity & listing review</h2><p>Local product image library, deterministic quality checks and editable channel drafts.</p></div><span className="ops-local-label"><ShieldCheck size={15}/> Device-local</span></div>
    {!products.length ? <p className="ops-empty">Add or import a product to start the workbench.</p> : <>
      <div className="ops-controls"><label>Product<select value={selected?.sku ?? ''} onChange={event => setSelectedSku(event.target.value)}>{products.map(product => <option key={product.id} value={product.sku}>{product.sku} — {product.title}</option>)}</select></label><label>Channel preset<select value={channel} onChange={event => setChannel(event.target.value)}>{CHANNELS.map(item => <option key={item}>{item}</option>)}</select></label><label>Market / locale<input value={market} onChange={event => setMarket(event.target.value)} /></label></div>
      {selected && <div className="ops-grid">
        <article className="ops-card"><div className="ops-card-title"><ImagePlus size={18}/><h3>Product image library</h3></div><p>Attach source images to SKU. Original files are kept in this browser; no cloud backup.</p><button onClick={() => fileRef.current?.click()}><ImagePlus size={15}/> Add images</button><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={event => void addImages(event.target.files)}/><div className="ops-image-list">{selectedImages.map(image => <div key={image.id}><span>{image.name} <small>{Math.max(1, Math.round(image.size / 1024))} KB</small></span><button aria-label={'Remove ' + image.name} onClick={() => void removeImage(image)}><Trash2 size={14}/></button></div>)}{!selectedImages.length && <small>No images attached to this SKU yet.</small>}</div></article>
        <article className="ops-card"><div className="ops-card-title"><ShieldCheck size={18}/><h3>Identity & content guard</h3></div><div className="ops-score">{passed}/{readiness.length} <small>checks passed</small></div>{readiness.map(item => <div className="ops-check" key={item.label}><span>{item.label}</span>{item.ok ? <CheckCircle2 size={16} className="ops-ok"/> : <span className="ops-missing">Needs review</span>}</div>)}<p className="ops-disclaimer">Rule-based checks only. No AI vision, image-to-product matching or legal certification is claimed. A person must verify image identity, variants, claims and channel policy.</p></article>
        <article className="ops-card ops-listing"><div className="ops-card-title"><FileText size={18}/><h3>Multi-market listing draft</h3></div><label>Title draft<input readOnly value={titleDraft}/></label><label>Description draft<textarea readOnly rows={4} value={descriptionDraft}/></label><label>Price<input readOnly value={selected.price ? selected.price + ' ' + selected.currency : 'Not provided'}/></label><button onClick={downloadDraft}><FileText size={15}/> Export editable draft</button><p className="ops-disclaimer">Generic text draft only — not an official Amazon, Etsy or Shopify feed format, translation, currency conversion or policy check.</p></article>
      </div>}
      {selected && <div className="ops-approval"><div><b>Human approval</b><p>Approval is a local workflow marker, not marketplace approval.</p></div><select aria-label="Approval status" value={reviews[selected.sku] ?? 'draft'} onChange={event => setReview(event.target.value as 'draft' | 'review' | 'approved')}><option value="draft">Draft</option><option value="review">Needs review</option><option value="approved">Human approved</option></select></div>}
      <small className="ops-notice">{notice}</small>
    </>}
  </section>
}
