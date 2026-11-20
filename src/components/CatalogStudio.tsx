import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, FolderOpen, Package, ShieldCheck, Upload, Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { exportProductCsv, parseProductCsv, validateCatalog, type ProductRecord } from '../lib/catalog'
import BrandMemory from './BrandMemory'
import { getProducts, replaceProducts } from '../lib/catalogDb'
import './CatalogStudio.css'

const emptyProduct = (): ProductRecord => ({
  id: crypto.randomUUID(), sku: '', title: '', brand: '', category: '', description: '',
  color: '', material: '', price: '', currency: 'USD', locale: 'en',
  source: 'manual', updatedAt: Date.now()
})

export default function CatalogStudio() {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Loading local catalog…')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [formError, setFormError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const issues = useMemo(() => validateCatalog(products), [products])
  const errors = issues.filter(issue => issue.severity === 'error').length
  const warnings = issues.filter(issue => issue.severity === 'warning').length

  useEffect(() => {
    getProducts().then(items => {
      setProducts(items)
      setMessage(items.length ? 'Your catalog is stored on this device.' : 'Add a product or import a CSV to start.')
    }).catch(() => setMessage('Local database is unavailable in this browser.'))
  }, [])

  const persist = async (next: ProductRecord[], successMessage: string) => {
    setBusy(true)
    try {
      await replaceProducts(next)
      setProducts(next)
      setMessage(successMessage)
      return true
    } catch {
      setMessage('Could not save changes to this device. Your previous catalog is unchanged.')
      return false
    } finally { setBusy(false) }
  }

  const importCsv = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const parsed = parseProductCsv(await file.text())
      const merged = [...products]
      const bySku = new Map(merged.filter(item => item.sku.trim()).map((item, index) => [item.sku.trim().toLowerCase(), index]))
      let added = 0
      for (const item of parsed) {
        const key = item.sku.trim().toLowerCase()
        const index = key ? bySku.get(key) : undefined
        if (index === undefined) {
          if (key) bySku.set(key, merged.length)
          merged.push(item)
          added += 1
        } else merged[index] = { ...merged[index], ...item, id: merged[index].id }
      }
      await replaceProducts(merged)
      setProducts(merged)
      setMessage(`Imported ${parsed.length} rows: ${added} new, ${parsed.length - added} updated. ${merged.length} total products.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV import failed.')
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const saveProduct = async () => {
    if (!editing) return
    if (!editing.sku.trim() || !editing.title.trim()) {
      setFormError('SKU and product title are required.')
      return
    }
    if (editing.price.trim() && (!Number.isFinite(Number(editing.price)) || Number(editing.price) < 0)) {
      setFormError('Price must be a non-negative number.')
      return
    }
    const duplicate = products.some(item => item.id !== editing.id && item.sku.trim().toLowerCase() === editing.sku.trim().toLowerCase())
    if (duplicate) {
      setFormError('This SKU already exists. Each product must have a unique SKU.')
      return
    }
    const exists = products.some(item => item.id === editing.id)
    const next = exists
      ? products.map(item => item.id === editing.id ? { ...editing, sku: editing.sku.trim(), title: editing.title.trim(), updatedAt: Date.now() } : item)
      : [...products, { ...editing, sku: editing.sku.trim(), title: editing.title.trim(), updatedAt: Date.now() }]
    if (await persist(next, exists ? 'Product record updated.' : 'Product added to your local catalog.')) setEditing(null)
    setFormError('')
  }

  const removeProduct = async (product: ProductRecord) => {
    if (!window.confirm(`Delete product ${product.sku || product.title} from this device?`)) return
    const next = products.filter(item => item.id !== product.id)
    await persist(next, 'Product deleted from this device.')
  }

  const download = () => {
    const blob = new Blob([exportProductCsv(products)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'nova-product-catalog.csv'; anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const visible = products.filter(product => [product.sku, product.title, product.brand, product.category].join(' ').toLowerCase().includes(filter.toLowerCase()))
  type EditableField = 'sku' | 'title' | 'brand' | 'category' | 'description' | 'color' | 'material' | 'price' | 'currency' | 'locale'
  const field = (key: EditableField, label: string, required = false) => (
    <label className="product-edit-field"><span>{label}{required ? ' *' : ''}</span>
      {key === 'description'
        ? <textarea value={String(editing?.[key] ?? '')} onChange={event => setEditing(current => current ? { ...current, [key]: event.target.value } : current)} rows={4}/>
        : <input value={String(editing?.[key] ?? '')} onChange={event => setEditing(current => current ? { ...current, [key]: event.target.value } : current)} />}
    </label>
  )

  return <main className="catalog-page">
    <header className="catalog-header"><a href="/">← NOVA</a><span>PRODUCT OPERATIONS</span><a href="/editor">Open editor ↗</a></header>
    <section className="catalog-hero"><div><span className="catalog-kicker">NOVA COMMERCE INTELLIGENCE</span><h1>Your product data.<br/><em>Finally under control.</em></h1><p>Build one verified product record, catch catalog issues and prepare clean data for every sales channel. Your catalog stays on this device.</p><div className="catalog-actions"><button onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={16}/>{busy ? 'Saving…' : 'Import product CSV'}</button><button className="secondary" onClick={download} disabled={!products.length}><Download size={16}/> Export catalog</button><button className="secondary" onClick={() => { setFormError(''); setEditing(emptyProduct()) }} disabled={busy}><Plus size={16}/> Add product</button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={event => void importCsv(event.target.files?.[0])}/></div><small>{message}</small></div><div className="catalog-hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><Package size={76}/><span>PRODUCT<br/>TRUTH RECORD</span></div></section>
    <section className="catalog-metrics"><article><span>PRODUCTS</span><b>{products.length}</b><small>Stored locally</small></article><article><span>BLOCKING ERRORS</span><b className={errors ? 'metric-danger' : ''}>{errors}</b><small>Must be corrected</small></article><article><span>REVIEW WARNINGS</span><b>{warnings}</b><small>Recommended fields</small></article><article><span>DATA CONTROL</span><b><ShieldCheck size={25}/></b><small>Local-first storage</small></article></section>
    <section className="catalog-workspace"><div className="catalog-section-heading"><div><span className="catalog-kicker">CATALOG INTELLIGENCE</span><h2>Product truth records</h2></div><label className="catalog-search"><FolderOpen size={15}/><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search SKU, brand, title…"/></label></div>
      {products.length ? <div className="catalog-table-wrap"><table><thead><tr><th>SKU</th><th>PRODUCT</th><th>BRAND</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{visible.map(product => { const rowIssues = issues.filter(issue => issue.sku === product.sku); return <tr key={product.id}><td>{product.sku || '—'}</td><td><strong>{product.title || 'Untitled product'}</strong><small>{product.color} {product.material}</small></td><td>{product.brand || '—'}</td><td>{product.category || '—'}</td><td>{product.price ? `${product.currency} ${product.price}` : '—'}</td><td><span className={rowIssues.some(issue => issue.severity === 'error') ? 'status-error' : rowIssues.length ? 'status-review' : 'status-ready'}>{rowIssues.some(issue => issue.severity === 'error') ? 'FIX REQUIRED' : rowIssues.length ? 'REVIEW' : 'READY'}</span></td><td><div className="product-row-actions"><button aria-label={`Edit ${product.sku}`} onClick={() => { setFormError(''); setEditing({ ...product }) }}><Pencil size={15}/></button><button aria-label={`Delete ${product.sku}`} onClick={() => void removeProduct(product)}><Trash2 size={15}/></button></div></td></tr> })}</tbody></table>{!visible.length && <p className="catalog-empty">No matching products.</p>}</div> : <div className="catalog-empty-state"><FileSpreadsheet size={30}/><h3>Start with your existing product sheet</h3><p>Import a CSV with at least SKU and Title columns, or add your first product manually.</p><button onClick={() => fileRef.current?.click()}>Choose CSV file</button></div>}
      {issues.length > 0 && <aside className="catalog-issues"><h3>Data quality report <span>{issues.length} findings</span></h3>{issues.slice(0, 30).map((issue, index) => <div key={`${issue.sku}-${issue.field}-${index}`}><b>{issue.sku}</b><span>{issue.field}</span><p>{issue.message}</p><i className={issue.severity}>{issue.severity.toUpperCase()}</i></div>)}</aside>}
    </section>
    {editing && <div className="product-edit-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null) }}><section className="product-edit-panel" role="dialog" aria-modal="true" aria-labelledby="product-edit-title"><header><div><span className="catalog-kicker">PRODUCT TRUTH RECORD</span><h2 id="product-edit-title">{products.some(item => item.id === editing.id) ? 'Edit product' : 'Add product'}</h2></div><button className="product-edit-close" onClick={() => setEditing(null)} aria-label="Close"><X/></button></header><div className="product-edit-grid">{field('sku','SKU',true)}{field('title','Product title',true)}{field('brand','Brand')}{field('category','Category')}{field('color','Colour')}{field('material','Material')}{field('price','Price')}{field('currency','Currency')}{field('locale','Locale')}{field('description','Description')}</div>{formError && <p className="product-edit-error">{formError}</p>}<footer><button className="secondary" onClick={() => setEditing(null)}>Cancel</button><button onClick={() => void saveProduct()} disabled={busy}><Save size={15}/> Save record</button></footer></section></div>}
    <BrandMemory/>
    <footer className="catalog-footer">NOVA · PRODUCT OPERATIONS OS <span>Phase 1 · Local catalog foundation</span></footer>
  </main>
}
