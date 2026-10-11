## 2025-05-18 - Precomputed Canvas Film Grain Noise Coordinates
**Learning:** Performing LCG PRNG arithmetic (multiplications and modulo) inside canvas animation or render loops up to 8,000 times per frame adds unnecessary CPU overhead on every render tick.
**Action:** Pre-compute deterministic pseudo-random normalized coordinates into module-level `Float32Array` lookup tables when initial seeds are fixed across render passes.
