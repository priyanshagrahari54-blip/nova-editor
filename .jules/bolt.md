# Bolt Performance Journal

## 2026-09-22 - Canvas 2D Path Batching & React Re-render Waveform Memoization
**Learning:** Calling `ctx.fillRect()` repeatedly inside loops (e.g. 8,000–12,000 times for grain effects) causes severe draw call overhead per frame in Canvas 2D contexts. In React, components receiving high-frequency props like `currentTime` (60 Hz) re-evaluate un-memoized JSX loops on every frame.
**Action:** Always batch canvas shape drawing into a single path (`ctx.beginPath()`, `ctx.rect()`, `ctx.fill()`), and use `useMemo` for static sub-trees inside frequently re-rendering components.
