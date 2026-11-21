export type SavedProject = { id: string; name: string; updatedAt: number; settings: unknown }

const DB_NAME = 'nova-editor-db'
const STORE = 'projects'

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open project database.'))
    request.onblocked = () => reject(new Error('Project database upgrade is blocked by another open tab.'))
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

    let tx: IDBTransaction
    try {
      tx = db.transaction(STORE, mode)
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
