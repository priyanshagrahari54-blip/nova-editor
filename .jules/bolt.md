## 2026-10-12 - Batching 2D Canvas Grain Particles
**Learning:** Calling `ctx.fillRect()` up to 8,000 times per frame inside Canvas 2D render loops causes severe draw call overhead on the main thread.
**Action:** Batch repeated rect shapes using `ctx.beginPath()`, `ctx.rect()` inside the loop, and a single `ctx.fill()` call to reduce draw calls from N to 1.
