import test from 'node:test'
import assert from 'node:assert/strict'
import { HistoryManager } from '../src/history/historyManager.ts'

test('undo and redo restore cloned states in order', () => {
  const history = new HistoryManager({ value: 0 })
  history.record('one', { value: 1 })
  history.record('two', { value: 2 })
  assert.deepEqual(history.undo(), { value: 1 })
  assert.deepEqual(history.undo(), { value: 0 })
  assert.equal(history.undo(), null)
  assert.deepEqual(history.redo(), { value: 1 })
  assert.deepEqual(history.redo(), { value: 2 })
  assert.equal(history.redo(), null)
})

test('new edits clear redo and identical states do not create entries', () => {
  const history = new HistoryManager({ value: 0 })
  history.record('one', { value: 1 })
  history.undo()
  history.record('same as current', { value: 0 })
  assert.equal(history.getUndoCount(), 0)
  history.record('new', { value: 2 })
  history.undo()
  history.record('branch', { value: 3 })
  assert.equal(history.canRedo(), false)
  assert.equal(history.getUndoCount(), 1)
})

test('coalesces consecutive edits with the same key into one undo step', () => {
  const history = new HistoryManager({ text: '' })
  history.record('type', { text: 'N' }, { coalesceKey: 'title' })
  history.record('type', { text: 'NO' }, { coalesceKey: 'title' })
  history.record('type', { text: 'NOVA' }, { coalesceKey: 'title' })
  assert.equal(history.getUndoCount(), 1)
  assert.deepEqual(history.undo(), { text: '' })
  assert.deepEqual(history.redo(), { text: 'NOVA' })
})

test('caps history, resets stacks, and protects internal snapshots from mutation', () => {
  const history = new HistoryManager({ values: [] }, { maxEntries: 2 })
  history.record('one', { values: [1] })
  history.record('two', { values: [1, 2] })
  history.record('three', { values: [1, 2, 3] })
  assert.equal(history.getUndoCount(), 2)
  const entries = history.getEntries()
  entries[0].after.values.push(999)
  assert.deepEqual(history.getEntries()[0].after.values, [1, 2])
  const exported = history.exportSnapshot()
  exported.currentState.values.push(999)
  assert.deepEqual(history.getState(), { values: [1, 2, 3] })
  history.reset({ values: ['fresh'] })
  assert.equal(history.canUndo(), false)
  assert.equal(history.canRedo(), false)
  assert.deepEqual(history.getState(), { values: ['fresh'] })
})

test('snapshot restore preserves undo/redo behavior and advances ids', () => {
  const history = new HistoryManager({ value: 0 })
  history.record('one', { value: 1 })
  history.record('two', { value: 2 })
  history.undo()
  const snapshot = history.exportSnapshot()
  const restored = new HistoryManager({ value: -1 })
  assert.deepEqual(restored.restoreSnapshot(snapshot), { value: 1 })
  assert.deepEqual(restored.redo(), { value: 2 })
  restored.record('three', { value: 3 })
  assert.equal(restored.getEntries().at(-1)?.id, 'edit-3')
})
