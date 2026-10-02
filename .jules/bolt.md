# Bolt Performance Journal

## 2026-08-30 - Batch Canvas2D Path Drawing & Timeline JSX Memoization

**Learning:** In `PhotoCanvas.tsx` and `ExportStudio.tsx`, drawing film grain with up to 12,000 individual `ctx.fillRect()` operations caused massive Canvas2D draw call overhead per frame. Batching subpaths with `ctx.rect()` inside a single `ctx.beginPath()` and executing a single `ctx.fill()` reduced draw call overhead from thousands down to 1 call per frame (<1ms). Additionally, inline JSX array generation in `ProfessionalTimeline.tsx` was executing on every playhead tick (30-60 fps); wrapping it in `useMemo` eliminated garbage collection and allocation pressure during video playback.
**Action:** Always batch Canvas2D geometry updates into single path fill calls when rendering thousands of particles, and use `useMemo` for timeline JSX elements that update at high frame rates.
