import type { ProductRecord } from './catalog'

const DB_NAME = 'nova-commerce-db'
const STORE = 'products'
const VERSION = 1

function openCatalogDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getProducts(): Promise<ProductRecord[]> {
  const db = await openCatalogDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result as ProductRecord[])
    request.onerror = () => reject(request.error)
  })
}

export async function replaceProducts(products: ProductRecord[]): Promise<void> {
  const db = await openCatalogDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    products.forEach(product => store.put(product))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Catalog transaction aborted'))
  })
}
