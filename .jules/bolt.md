## 2025-05-18 - [Canvas Grain Pattern Caching]
**Learning:** Drawing thousands of individual 1x1 / small rectangles with `fillRect()` in `requestAnimationFrame` loops creates significant CPU draw-call overhead. Pre-generating an offscreen tileable noise pattern canvas and rendering with `ctx.createPattern()` reduces draw calls per frame to 1 and speeds up grain overlay rendering by >98%.
**Action:** Replace per-frame procedural `fillRect()` particle/grain rendering loops in HTML5 Canvas with offscreen tileable pattern fills (`ctx.createPattern`).
