export type SavedProject = { id: string; name: string; updatedAt: number; settings: unknown }

const DB_NAME = 'nova-editor-db'
const STORE = 'projects'

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    let settled = false
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      if (settled) {
        request.result.close()
        return
      }
      settled = true
      resolve(request.result)
    }
    request.onerror = () => {
      if (settled) return
      settled = true
      reject(request.error ?? new Error('Could not open project database.'))
    }
    request.onblocked = () => {
      if (settled) return
      settled = true
      reject(new Error('Project database upgrade is blocked by another open tab. Close other Nova tabs and retry.'))
    }
  })
}

function withTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return database().then(db => new Promise<T>((resolve, reject) => {
    let result: T
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      db.close()
      callback()
    }

    try {
      const tx = db.transaction(STORE, mode)
      const request = operation(tx.objectStore(STORE))
      request.onsuccess = () => { result = request.result }
      request.onerror = () => finish(() => reject(request.error ?? new Error('Project database request failed.')))
      tx.oncomplete = () => finish(() => resolve(result))
      tx.onerror = () => finish(() => reject(tx.error ?? new Error('Project database transaction failed.')))
      tx.onabort = () => finish(() => reject(tx.error ?? new Error('Project database transaction was aborted.')))
    } catch (error) {
      finish(() => reject(error))
    }
  }))
}

export async function saveProject(project: SavedProject) {
  await withTransaction('readwrite', store => store.put(project))
}

export async function recentProjects() {
  const projects = await withTransaction('readonly', store => store.getAll()) as SavedProject[]
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function loadProject(id: string): Promise<SavedProject | null> {
  const project = await withTransaction('readonly', store => store.get(id)) as SavedProject | undefined
  return project ?? null
}
