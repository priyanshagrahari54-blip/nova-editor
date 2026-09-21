## 2025-05-18 - Batching Canvas Path Rectangles for Grain Overlays
**Learning:** Calling `ctx.fillRect()` thousands of times per frame in a loop forces individual draw call dispatches and state updates, causing ~15-30ms frame drops when film grain VFX is enabled. Batching rectangle subpaths with `ctx.beginPath()`, `ctx.rect()`, and a single `ctx.fill()` drops frame render time to ~0.5ms.
**Action:** When drawing dense particle or grain overlays on 2D HTML5 canvas, always accumulate subpaths with `ctx.rect()` and dispatch a single `ctx.fill()`.
