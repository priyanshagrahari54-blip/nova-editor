export type HistorySource = 'user' | 'ai' | 'system'

export type HistoryEntry<T> = {
  id: string
  name: string
  description: string
  timestamp: number
  source: HistorySource
  before: T
  after: T
  /** Consecutive edits with the same key can be coalesced into one history entry. */
  coalesceKey?: string
}

export type HistoryOptions = {
  maxEntries?: number
}

export type HistorySnapshot<T> = {
  undoStack: HistoryEntry<T>[]
  redoStack: HistoryEntry<T>[]
  currentState: T
  nextId: number
}

/**
 * Bounded, non-destructive edit history.
 *
 * The manager owns cloned snapshots, so callers cannot mutate stored history
 * by changing an object returned from getState() or the history getters.
 */
export class HistoryManager<T> {
  private undoStack: HistoryEntry<T>[] = []
  private redoStack: HistoryEntry<T>[] = []
  private currentState: T
  private readonly maxEntries: number
  private nextId = 1

  constructor(initialState: T, options: HistoryOptions = {}) {
    this.currentState = this.clone(initialState)
    this.maxEntries = Math.max(1, Math.floor(options.maxEntries ?? 100))
  }

  private clone<U>(value: U): U {
    return structuredClone(value)
  }

  getState(): T {
    return this.clone(this.currentState)
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getUndoCount(): number {
    return this.undoStack.length
  }

  getRedoCount(): number {
    return this.redoStack.length
  }

  getEntries(): HistoryEntry<T>[] {
    return this.undoStack.map(entry => this.clone(entry))
  }

  getRedoEntries(): HistoryEntry<T>[] {
    return this.redoStack.map(entry => this.clone(entry))
  }

  record(
    name: string,
    nextState: T,
    options: {
      description?: string
      source?: HistorySource
      coalesceKey?: string
    } = {},
  ): T {
    const before = this.clone(this.currentState)
    const after = this.clone(nextState)

    if (JSON.stringify(before) === JSON.stringify(after)) {
      return this.getState()
    }

    const now = Date.now()
    const last = this.undoStack[this.undoStack.length - 1]
    const key = options.coalesceKey

    if (key && last?.coalesceKey === key) {
      last.after = after
      last.timestamp = now
      last.name = name
      last.description = options.description ?? name
      last.source = options.source ?? last.source
      this.currentState = after
      this.redoStack = []
      return this.getState()
    }

    const entry: HistoryEntry<T> = {
      id: `edit-${this.nextId++}`,
      name,
      description: options.description ?? name,
      timestamp: now,
      source: options.source ?? 'user',
      before,
      after,
      ...(key ? { coalesceKey: key } : {}),
    }

    this.undoStack.push(entry)
    if (this.undoStack.length > this.maxEntries) {
      this.undoStack.splice(0, this.undoStack.length - this.maxEntries)
    }

    this.currentState = after
    this.redoStack = []
    return this.getState()
  }

  undo(): T | null {
    const entry = this.undoStack.pop()
    if (!entry) return null

    this.redoStack.push(entry)
    this.currentState = this.clone(entry.before)
    return this.getState()
  }

  redo(): T | null {
    const entry = this.redoStack.pop()
    if (!entry) return null

    this.undoStack.push(entry)
    this.currentState = this.clone(entry.after)
    return this.getState()
  }

  reset(state: T): T {
    this.currentState = this.clone(state)
    this.undoStack = []
    this.redoStack = []
    return this.getState()
  }

  exportSnapshot(): HistorySnapshot<T> {
    return this.clone({
      undoStack: this.undoStack,
      redoStack: this.redoStack,
      currentState: this.currentState,
      nextId: this.nextId,
    })
  }

  restoreSnapshot(snapshot: HistorySnapshot<T>): T {
    this.undoStack = snapshot.undoStack
      .slice(-this.maxEntries)
      .map(entry => this.clone(entry))
    this.redoStack = snapshot.redoStack.map(entry => this.clone(entry))
    this.currentState = this.clone(snapshot.currentState)
    this.nextId = Math.max(
      snapshot.nextId,
      ...this.undoStack.map(entry => Number(entry.id.replace('edit-', '')) + 1),
      ...this.redoStack.map(entry => Number(entry.id.replace('edit-', '')) + 1),
      1,
    )
    return this.getState()
  }
}
