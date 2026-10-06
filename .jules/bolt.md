## 2026-10-06 - Canvas2D Film Grain Drawing Batching
**Learning:** Calling `ctx.fillRect()` up to 12,000 times inside single-frame render loops (`PhotoCanvas` and `ExportStudio`) causes severe Canvas2D state and draw call overhead. Accumulating rect paths using `ctx.rect()` and calling `ctx.fill()` once reduces draw calls from thousands to 1 per frame while keeping visual output identical.
**Action:** Always batch repeated canvas rect/shape drawings using `ctx.beginPath()`, `ctx.rect()`, and a single `ctx.fill()` call when fill parameters are uniform.
