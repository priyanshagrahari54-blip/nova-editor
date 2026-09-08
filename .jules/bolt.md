# Bolt Performance Journal

## 2026-09-08 - Batching Canvas 2D Rectangles for Grain Rendering
**Learning:** Calling `ctx.fillRect()` repeatedly inside a high-iteration loop (e.g., 8,000–12,000 times for canvas noise/grain) incurs severe Canvas 2D API dispatch and state change overhead (~5–10ms per frame).
**Action:** Construct a single path using `ctx.beginPath()` and `ctx.rect()` inside the loop, followed by a single `ctx.fill()` call per frame. This reduces dispatches from O(N) to 1 dispatch per frame while keeping visual output identical.
