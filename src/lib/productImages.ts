import type { ProductRecord } from './catalog'

const DB_NAME = 'nova-commerce-db'
const IMAGE_STORE = 'product-images'

export type ProductImage = { id: string; sku: string; name: string; type: string; size: number; blob: Blob; createdAt: number }

function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' })
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getProductImages(): Promise<ProductImage[]> {
  const db = await openImageDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).getAll()
    request.onsuccess = () => resolve(request.result as ProductImage[])
    request.onerror = () => reject(request.error)
  })
}

export async function saveProductImage(image: ProductImage): Promise<ProductImage> {
  const db = await openImageDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).put(image)
    tx.oncomplete = () => resolve(image)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Image save aborted'))
  })
}

export async function deleteProductImage(id: string): Promise<void> {
  const db = await openImageDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite')
    tx.objectStore(IMAGE_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
