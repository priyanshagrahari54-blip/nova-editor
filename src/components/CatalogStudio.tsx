import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Download, FileSpreadsheet, FolderOpen, Package, ShieldCheck, Upload } from 'lucide-react'
import { exportProductCsv, parseProductCsv, validateCatalog, type ProductRecord } from '../lib/catalog'
import { getProducts, replaceProducts } from '../lib/catalogDb'
import './CatalogStudio.css'

export default function CatalogStudio() {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Loading local catalog…')
  const [filter, setFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const issues = useMemo(() => validateCatalog(products), [products])
  const errors = issues.filter(issue => issue.severity === 'error').length
  const warnings = issues.filter(issue => issue.severity === 'warning').length

  useEffect(() => { getProducts().then(items => { setProducts(items); setMessage(items.length ? 'Your catalog is stored on this device.' : 'Import a product CSV to start your catalog.') }).catch(() => setMessage('Local database is unavailable in this browser.')) }, [])

  const importCsv = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const parsed = parseProductCsv(await file.text())
      const merged = [...products]
      const bySku = new Map(merged.map((item, index) => [item.sku.toLowerCase(), index]))
      for (const item of parsed) {
        const index = bySku.get(item.sku.toLowerCase())
        if (index === undefined) { bySku.set(item.sku.toLowerCase(), merged.length); merged.push(item) }
        else merged[index] = { ...merged[index], ...item, id: merged[index].id }
      }
      await replaceProducts(merged)
      setProducts(merged)
      setMessage(`Imported ${parsed.length} rows. ${merged.length} products in your catalog.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV import failed.')
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const download = () => {
    const blob = new Blob([exportProductCsv(products)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'nova-product-catalog.csv'; anchor.click()
    URL.revokeObjectURL(url)
  }

  const visible = products.filter(product => [product.sku, product.title, product.brand, product.category].join(' ').toLowerCase().includes(filter.toLowerCase()))

  return <main className="catalog-page">
    <header className="catalog-header"><a href="/">← NOVA</a><span>PRODUCT OPERATIONS</span><a href="/editor">Open editor ↗</a></header>
    <section className="catalog-hero"><div><span className="catalog-kicker">NOVA COMMERCE INTELLIGENCE</span><h1>Your product data.<br/><em>Finally under control.</em></h1><p>Build one verified product record, catch catalog issues and prepare clean data for every sales channel. Your catalog stays on this device.</p><div className="catalog-actions"><button onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={16}/>{busy ? 'Importing…' : 'Import product CSV'}</button><button className="secondary" onClick={download} disabled={!products.length}><Download size={16}/> Export catalog</button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={event => void importCsv(event.target.files?.[0])}/></div><small>{message}</small></div><div className="catalog-hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><Package size={76}/><span>PRODUCT<br/>TRUTH RECORD</span></div></section>
    <section className="catalog-metrics"><article><span>PRODUCTS</span><b>{products.length}</b><small>Stored locally</small></article><article><span>BLOCKING ERRORS</span><b className={errors ? 'metric-danger' : ''}>{errors}</b><small>Must be corrected</small></article><article><span>REVIEW WARNINGS</span><b>{warnings}</b><small>Recommended fields</small></article><article><span>DATA CONTROL</span><b><ShieldCheck size={25}/></b><small>Local-first storage</small></article></section>
    <section className="catalog-workspace"><div className="catalog-section-heading"><div><span className="catalog-kicker">CATALOG INTELLIGENCE</span><h2>Product truth records</h2></div><label className="catalog-search"><FolderOpen size={15}/><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search SKU, brand, title…"/></label></div>
      {products.length ? <div className="catalog-table-wrap"><table><thead><tr><th>SKU</th><th>PRODUCT</th><th>BRAND</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th></tr></thead><tbody>{visible.map(product => { const rowIssues = issues.filter(issue => issue.sku === product.sku); return <tr key={product.id}><td>{product.sku || '—'}</td><td><strong>{product.title || 'Untitled product'}</strong><small>{product.color} {product.material}</small></td><td>{product.brand || '—'}</td><td>{product.category || '—'}</td><td>{product.price ? `${product.currency} ${product.price}` : '—'}</td><td><span className={rowIssues.some(issue => issue.severity === 'error') ? 'status-error' : rowIssues.length ? 'status-review' : 'status-ready'}>{rowIssues.some(issue => issue.severity === 'error') ? 'FIX REQUIRED' : rowIssues.length ? 'REVIEW' : 'READY'}</span></td></tr> })}</tbody></table>{!visible.length && <p className="catalog-empty">No matching products.</p>}</div> : <div className="catalog-empty-state"><FileSpreadsheet size={30}/><h3>Start with your existing product sheet</h3><p>Import a CSV with at least SKU and Title columns. Brand, category, price, colour and material are optional.</p><button onClick={() => fileRef.current?.click()}>Choose CSV file</button></div>}
      {issues.length > 0 && <aside className="catalog-issues"><h3>Data quality report <span>{issues.length} findings</span></h3>{issues.slice(0, 30).map((issue, index) => <div key={`${issue.sku}-${issue.field}-${index}`}><b>{issue.sku}</b><span>{issue.field}</span><p>{issue.message}</p><i className={issue.severity}>{issue.severity.toUpperCase()}</i></div>)}</aside>}
    </section>
    <footer className="catalog-footer">NOVA · PRODUCT OPERATIONS OS <span>Phase 1 · Local catalog foundation</span></footer>
  </main>
}
