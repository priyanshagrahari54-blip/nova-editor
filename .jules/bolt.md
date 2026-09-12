## 2026-09-12 - Batch Canvas 2D Path Calls for Noise & Grain
**Learning:** Calling `ctx.fillRect()` thousands of times in a loop per frame incurs severe Canvas2D draw call overhead in HTML5 canvas rendering.
**Action:** Construct a single path with `ctx.beginPath()` and `ctx.rect()` inside the loop, then execute a single `ctx.fill()` call.
