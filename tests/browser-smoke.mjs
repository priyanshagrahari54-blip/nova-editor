import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.NOVA_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ headless: true })

try {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(15_000)
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
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
  const pngBase64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 48
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is unavailable')
    ctx.fillStyle = '#2563eb'
    ctx.fillRect(0, 0, 64, 48)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  await page.locator('input[type="file"]').setInputFiles({
    name: 'browser-smoke.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBase64, 'base64'),
  })
  await page.getByText('1 media file imported').waitFor()
  await page.getByRole('button', { name: 'Media', exact: true }).click()
  await page.getByRole('button', { name: 'browser-smoke.png' }).waitFor()
  await page.locator('.save-button').click()
  await page.getByText('Project saved locally with 1 media file.').waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Restore saved settings & layers' }).click()
  await page.getByText('Project restored with 1 media file.').waitFor()
  await page.getByRole('button', { name: 'Media', exact: true }).click()
  await page.getByRole('button', { name: 'browser-smoke.png' }).waitFor()

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
    const chunks = []
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    const stopped = new Promise(resolve => { recorder.onstop = () => resolve() })
    recorder.start()
    await new Promise(resolve => setTimeout(resolve, 500))
    recorder.stop()
    await stopped
    stream.getTracks().forEach(track => track.stop())
    const bytes = new Uint8Array(await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer())
    let binary = ''
    bytes.forEach(byte => { binary += String.fromCharCode(byte) })
    return btoa(binary)
  })
  await page.locator('input[type="file"]').setInputFiles({
    name: 'browser-smoke.webm',
    mimeType: 'video/webm',
    buffer: Buffer.from(videoBytes, 'base64'),
  })
  await page.getByText('1 media file imported').waitFor()
  await page.getByRole('button', { name: 'browser-smoke.webm' }).waitFor()
  await page.locator('.save-button').click()
  await page.getByText('Project saved locally with 2 media files.').waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Restore saved settings & layers' }).click()
  await page.getByText('Project restored with 2 media files.').waitFor()
  await page.getByRole('button', { name: 'Media', exact: true }).click()
  await page.getByRole('button', { name: 'browser-smoke.webm' }).click()
  await page.locator('video').waitFor()
  await page.getByRole('button', { name: 'Projects', exact: true }).click()

  // Legacy/malformed stored asset metadata should be skipped, not crash restore.
  await page.evaluate(async () => {
    const request = indexedDB.open('nova-editor-db', 1)
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise((resolve, reject) => {
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
