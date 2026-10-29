## 2026-10-29 - Canvas 2D Film Grain Noise Pattern Caching
**Learning:** Iterating thousands of `ctx.fillRect()` calls per frame for canvas noise / film grain effects causes heavy main-thread rendering lag (15-30ms per frame).
**Action:** Pre-generate a 256x256 offscreen noise tile and cache `CanvasPattern` tile instances. Use `ctx.fillStyle = pattern; ctx.fillRect(0, 0, width, height)` to render noise in a single draw call (<0.1ms).
