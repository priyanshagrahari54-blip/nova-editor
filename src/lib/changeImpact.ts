import type { ProductRecord } from './catalog'

export type ProductChangeEvent = {
  id: string
  sku: string
  title: string
  changedFields: string[]
  reviewActions: string[]
  createdAt: number
}

const KEY = 'nova-product-change-impact-v1'
const trackedFields: Array<keyof ProductRecord> = ['title','brand','category','description','color','material','price','currency','locale']

const impactByField: Partial<Record<keyof ProductRecord, string[]>> = {
  title: ['Review marketplace titles and search terms', 'Review campaign headlines and product labels'],
  brand: ['Review brand attribution on listings and creative assets'],
  category: ['Re-run category-specific attribute and channel rule checks'],
  description: ['Review bullets, descriptions, FAQs and translated copy'],
  color: ['Re-check product image colour fidelity and variant associations', 'Review colour names in every locale'],
  material: ['Review material claims, care copy and close-up imagery'],
  price: ['Review price-bearing graphics, promotions and exported feeds'],
  currency: ['Re-check localized prices and currency formatting'],
  locale: ['Review translations, units, spelling and channel-specific copy']
}

export function recordProductChange(before: ProductRecord, after: ProductRecord): ProductChangeEvent | null {
  const changedFields = trackedFields.filter(field => String(before[field] ?? '') !== String(after[field] ?? ''))
  if (!changedFields.length) return null
  const reviewActions = Array.from(new Set(changedFields.flatMap(field => impactByField[field] ?? ['Review assets and channel exports that use this field'])))
  const event: ProductChangeEvent = {
    id: crypto.randomUUID(), sku: after.sku, title: after.title, changedFields: changedFields.map(String),
    reviewActions, createdAt: Date.now()
  }
  try {
    const history = getRecentProductChanges()
    localStorage.setItem(KEY, JSON.stringify([event, ...history].slice(0, 100)))
  } catch { /* Keep product editing available if browser storage is unavailable. */ }
  return event
}

export function getRecentProductChanges(): ProductChangeEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as ProductChangeEvent[] : []
  } catch { return [] }
}
