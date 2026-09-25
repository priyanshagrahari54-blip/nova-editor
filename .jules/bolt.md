## 2026-09-25 - Offscreen Canvas Pattern Tile for Noise/Grain
**Learning:** Rendering procedural canvas grain using thousands of individual `ctx.fillRect` draw calls per frame (up to 12,000 calls) heavily bottlenecks canvas rendering context pipeline and GPU submission in 2D media apps.
**Action:** Pre-render a tileable 256x256 noise texture to an offscreen canvas, turn it into a `CanvasPattern` via `ctx.createPattern(offscreen, 'repeat')`, cache it, and fill the main canvas in a single $O(1)$ `ctx.fillRect` call.
