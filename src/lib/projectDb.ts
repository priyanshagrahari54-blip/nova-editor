export type SavedProject = { id: string; name: string; updatedAt: number; settings: unknown }

const DB_NAME = 'nova-editor-db'
const STORE = 'projects'

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveProject(project: SavedProject) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(project)
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error)
  })
}

export async function recentProjects() {
  const db = await database()
  return new Promise<SavedProject[]>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => resolve((request.result as SavedProject[]).sort((a, b) => b.updatedAt - a.updatedAt))
    request.onerror = () => reject(request.error)
  })
}
