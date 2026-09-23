# Bolt Performance Journal

## 2026-08-30 - Path2D Batching for Canvas Grain/Particles Rendering
**Learning:** Calling `ctx.fillRect()` thousands of times in a loop per frame (e.g., 8,000–12,000 grain dots) causes heavy canvas API overhead and frame drops due to repeated state switches and individual draw operations in the 2D rendering context.
**Action:** Accumulate primitive rectangle geometries into a single `Path2D` object inside rendering loops and execute a single `ctx.fill(path)` call, reducing canvas draw call overhead by ~90%+.
