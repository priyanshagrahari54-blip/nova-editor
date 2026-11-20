export type ProductRecord = {
  id: string
  sku: string
  title: string
  brand: string
  category: string
  description: string
  color: string
  material: string
  price: string
  currency: string
  locale: string
  source: 'import' | 'manual'
  updatedAt: number
}

export type CatalogIssue = { sku: string; field: string; severity: 'error' | 'warning'; message: string }

const aliases: Record<keyof Omit<ProductRecord, 'id' | 'source' | 'updatedAt'>, string[]> = {
  sku: ['sku', 'seller sku', 'product id', 'item sku', 'variant sku'],
  title: ['title', 'product title', 'name', 'product name'],
  brand: ['brand', 'manufacturer'],
  category: ['category', 'product type', 'type'],
  description: ['description', 'product description', 'details'],
  color: ['color', 'colour'],
  material: ['material', 'fabric'],
  price: ['price', 'selling price', 'list price'],
  currency: ['currency', 'currency code'],
  locale: ['locale', 'language', 'market']
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let value = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === delimiter && !quoted) {
      values.push(value.trim()); value = ''
    } else value += char
  }
  values.push(value.trim())
  return values
}

export function parseProductCsv(text: string): ProductRecord[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []
  const delimiter = (lines[0].match(/,/g) ?? []).length >= (lines[0].match(/;/g) ?? []).length ? ',' : ';'
  const headers = parseCsvLine(lines[0], delimiter).map(value => value.toLowerCase().replace(/[_-]+/g, ' ').trim())
  const indexes = Object.fromEntries(Object.entries(aliases).map(([field, names]) => [field, headers.findIndex(header => names.includes(header))])) as Record<string, number>
  if (indexes.sku < 0 || indexes.title < 0) throw new Error('CSV must contain SKU (or Product ID) and Title (or Product Name) columns.')
  const records: ProductRecord[] = []
  for (const [rowIndex, line] of lines.slice(1).entries()) {
    const cells = parseCsvLine(line, delimiter)
    const get = (field: string) => indexes[field] >= 0 ? (cells[indexes[field]] ?? '').trim() : ''
    const sku = get('sku')
    const title = get('title')
    if (!sku && !title) continue
    records.push({
      id: `csv-${rowIndex}-${sku || crypto.randomUUID()}`, sku, title,
      brand: get('brand'), category: get('category'), description: get('description'),
      color: get('color'), material: get('material'), price: get('price'),
      currency: get('currency') || 'USD', locale: get('locale') || 'en',
      source: 'import', updatedAt: Date.now()
    })
  }
  return records
}

export function validateCatalog(records: ProductRecord[]): CatalogIssue[] {
  const issues: CatalogIssue[] = []
  const seen = new Set<string>()
  for (const product of records) {
    const skuKey = product.sku.trim().toLowerCase()
    if (!skuKey) issues.push({ sku: product.sku || '(missing)', field: 'sku', severity: 'error', message: 'SKU is required for reliable catalog identity.' })
    else if (seen.has(skuKey)) issues.push({ sku: product.sku, field: 'sku', severity: 'error', message: 'Duplicate SKU appears more than once.' })
    else seen.add(skuKey)
    if (!product.title.trim()) issues.push({ sku: product.sku || '(missing)', field: 'title', severity: 'error', message: 'Product title is missing.' })
    if (!product.brand.trim()) issues.push({ sku: product.sku || '(missing)', field: 'brand', severity: 'warning', message: 'Brand is missing.' })
    if (!product.category.trim()) issues.push({ sku: product.sku || '(missing)', field: 'category', severity: 'warning', message: 'Category is missing.' })
    if (product.price.trim() && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)) issues.push({ sku: product.sku, field: 'price', severity: 'error', message: 'Price must be a non-negative number.' })
  }
  return issues
}

export function exportProductCsv(records: ProductRecord[]): string {
  const fields: Array<keyof ProductRecord> = ['sku','title','brand','category','description','color','material','price','currency','locale']
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [fields.join(','), ...records.map(record => fields.map(field => quote(record[field])).join(','))].join('\r\n')
}
