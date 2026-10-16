## 2025-05-18 - Canvas Film Grain Pattern Caching
**Learning:** In HTML5 Canvas rendering loops (`requestAnimationFrame`), iterating thousands of individual `ctx.fillRect` calls for noise/grain rendering causes heavy DOM/canvas command overhead (~5-15ms/frame). Using `ctx.createPattern()` with a lazily cached offscreen noise canvas converts the $O(N)$ draw calls to a single $O(1)$ fill operation (~0.1ms/frame).
**Action:** Replace high-frequency loop `fillRect` operations in canvas render passes with cached tileable patterns.
