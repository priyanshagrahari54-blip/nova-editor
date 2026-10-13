## 2025-05-18 - Batch Canvas 2D Rect Operations for Noise Rendering
**Learning:** Calling `ctx.fillRect()` thousands of times in a loop incurs significant context switching and browser draw-call overhead on HTML5 Canvas 2D.
**Action:** Accumulate rect sub-paths with `ctx.rect()` inside a single `ctx.beginPath()` pass and issue a single `ctx.fill()` call to execute all particle draws in one batch.
