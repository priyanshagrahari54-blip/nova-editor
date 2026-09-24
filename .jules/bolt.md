## 2026-09-24 - Canvas Grain Rendering Batching
**Learning:** Calling `ctx.fillRect()` thousands of times in a loop per frame creates significant Canvas 2D draw call overhead. Batching sub-paths with `ctx.rect()` and performing a single `ctx.fill()` call renders particle effects like film grain with significantly higher frame performance and zero visual regression.
**Action:** Always batch repeated single-color Canvas 2D geometry drawing calls using `beginPath()`, `rect()`, and `fill()` instead of looping individual `fillRect()` calls.
