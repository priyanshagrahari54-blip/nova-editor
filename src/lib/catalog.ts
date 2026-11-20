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
export type ProductField = keyof Omit<ProductRecord, 'id' | 'source' | 'updatedAt'>
export type CsvMapping = Partial<Record<ProductField, string>>

export const productFieldLabels: Record<ProductField, string> = {
  sku: 'SKU', title: 'Title', brand: 'Brand', category: 'Category', description: 'Description',
  color: 'Colour', material: 'Material', price: 'Price', currency: 'Currency', locale: 'Locale'
}

const aliases: Record<ProductField, string[]> = {
  sku: ['sku', 'seller sku', 'product id', 'item sku', 'variant sku'],
  title: ['title', 'product title', 'name', 'product name'],
  brand: ['brand', 'manufacturer'], category: ['category', 'product type', 'type'],
  description: ['description', 'product description', 'details'], color: ['color', 'colour'],
  material: ['material', 'fabric'], price: ['price', 'selling price', 'list price'],
  currency: ['currency', 'currency code'], locale: ['locale', 'language', 'market']
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === delimiter && !quoted) {
      row.push(value.trim()); value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(value.trim()); value = ''
      if (row.some(cell => cell.length)) rows.push(row)
      row = []
    } else value += char
  }
  row.push(value.trim())
  if (row.some(cell => cell.length)) rows.push(row)
  if (quoted) throw new Error('CSV contains an unclosed quoted field. Check the file and try again.')
  return rows
}

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[_-]+/g, ' ').trim()

export function getCsvHeaders(text: string): string[] {
  const sample = text.replace(/^\uFEFF/, '').slice(0, 20000)
  const comma = (sample.split('\n')[0].match(/,/g) ?? []).length
  const semicolon = (sample.split('\n')[0].match(/;/g) ?? []).length
  return parseCsv(sample, comma >= semicolon ? ',' : ';')[0] ?? []
}

export function parseProductCsv(text: string, mapping?: CsvMapping): ProductRecord[] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = (firstLine.match(/,/g) ?? []).length >= (firstLine.match(/;/g) ?? []).length ? ',' : ';'
  const rows = parseCsv(clean, delimiter)
  if (rows.length < 2) return []
  const headers = rows[0].map(normalizeHeader)
  const indexes = Object.fromEntries((Object.keys(aliases) as ProductField[]).map(field => {
    const selected = mapping?.[field]
    const index = selected ? rows[0].findIndex(header => header === selected) : headers.findIndex(header => aliases[field].includes(header))
    return [field, index]
  })) as Record<ProductField, number>
  if (indexes.sku < 0 || indexes.title < 0) throw new Error('Map both SKU and Title columns before importing.')
  return rows.slice(1).map((cells, rowIndex) => {
    const get = (field: ProductField) => indexes[field] >= 0 ? (cells[indexes[field]] ?? '').trim() : ''
    const sku = get('sku')
    const title = get('title')
    return { id: `csv-${rowIndex}-${sku || crypto.randomUUID()}`, sku, title,
      brand: get('brand'), category: get('category'), description: get('description'), color: get('color'),
      material: get('material'), price: get('price'), currency: get('currency') || 'USD',
      locale: get('locale') || 'en', source: 'import', updatedAt: Date.now() } satisfies ProductRecord
  }).filter(product => product.sku || product.title)
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
  const fields: ProductField[] = ['sku','title','brand','category','description','color','material','price','currency','locale']
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [fields.join(','), ...records.map(record => fields.map(field => quote(record[field])).join(','))].join('\r\n')
}
