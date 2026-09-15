## 2025-05-15 - Canvas path batching for grain effect
**Learning:** Calling `ctx.fillRect` thousands of times per frame in a loop incurs massive canvas API draw call overhead. Batching paths via `ctx.beginPath()`, `ctx.rect()`, and a single `ctx.fill()` reduces canvas render time by ~90%.
**Action:** Always batch repeated canvas fill operations with identical fillStyle into a single subpath fill call.
