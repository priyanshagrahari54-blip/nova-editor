import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.NOVA_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })

try {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.locator('.nova-app').waitFor()

  // Undo/redo through the actual toolbar, not only HistoryManager unit tests.
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await page.getByRole('button', { name: /Add text layer/ }).click()
  assert.equal(await page.locator('.layer-row').count(), 1, 'text layer should be created')
  await page.getByRole('button', { name: 'Undo' }).click()
  assert.equal(await page.locator('.layer-row').count(), 0, 'Undo should remove the text layer')
  await page.getByRole('button', { name: 'Redo' }).click()
  assert.equal(await page.locator('.layer-row').count(), 1, 'Redo should restore the text layer')

  // Image: import -> save to IndexedDB -> reload -> restore.
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="#2563eb"/></svg>')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'browser-smoke.svg',
    mimeType: 'image/svg+xml',
    buffer: svg,
  })
  await page.getByRole('button', { name: 'browser-smoke.svg' }).waitFor()
  await page.locator('.save-button').click()
  await page.getByText('Project saved locally with 1 media file.').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Restore saved settings & layers' }).click()
  await page.getByText('Project restored with 1 media file.').waitFor()
  await page.getByRole('button', { name: 'browser-smoke.svg' }).waitFor()

  // Produce a small real WebM in Chromium, then verify video Blob persistence.
  const videoBytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx || typeof MediaRecorder === 'undefined') throw new Error('MediaRecorder is unavailable in Chromium')
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(0, 0, 32, 32)
    const stream = canvas.captureStream(5)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' })
    const chunks: BlobPart[] = []
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    const stopped = new Promise<void>(resolve => { recorder.onstop = () => resolve() })
    recorder.start()
    await new Promise(resolve => setTimeout(resolve, 500))
    recorder.stop()
    await stopped
    stream.getTracks().forEach(track => track.stop())
    return await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer()
  })
  await page.locator('input[type="file"]').setInputFiles({
    name: 'browser-smoke.webm',
    mimeType: 'video/webm',
    buffer: Buffer.from(videoBytes),
  })
  await page.getByRole('button', { name: 'browser-smoke.webm' }).waitFor()
  await page.locator('.save-button').click()
  await page.getByText('Project saved locally with 1 media file.').waitFor()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Restore saved settings & layers' }).click()
  await page.getByText('Project restored with 1 media file.').waitFor()
  await page.getByRole('button', { name: 'browser-smoke.webm' }).waitFor()
  await page.locator('video').waitFor()

  // Legacy/malformed stored asset metadata should be skipped, not crash restore.
  await page.evaluate(async () => {
    const request = indexedDB.open('nova-editor-db', 1)
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite')
      tx.objectStore('projects').put({
        id: 'active-project',
        name: 'Legacy malformed project',
        updatedAt: Date.now(),
        settings: { assets: [{ name: '', kind: 'image', file: {} }], layers: [] },
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  })
  await page.getByRole('button', { name: 'Restore saved settings & layers' }).click()
  await page.getByText('Project settings and layers restored; no saved media files were available.').waitFor()

  console.log('Browser smoke passed: toolbar undo/redo, image/video IndexedDB round-trip, malformed legacy asset handling.')
  await context.close()
} finally {
  await browser.close()
}
