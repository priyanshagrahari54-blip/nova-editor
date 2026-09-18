## 2026-09-18 - Canvas Noise Pattern Optimization
**Learning:** Calling `context.fillRect()` thousands of times per frame in 2D canvas loops (e.g. 8,000–12,000 iterations for film grain) creates heavy CPU overhead and frame delays.
**Action:** Replace individual pixel/dot `fillRect()` loops with an offscreen noise pattern tile canvas generated once via `createImageData()` and rendered in a single `fillRect()` using `context.createPattern(tile, 'repeat')`.
