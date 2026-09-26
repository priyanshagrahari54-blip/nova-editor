## 2025-05-20 - Canvas ImageData Pixel Loop Optimization
**Learning:** In canvas pixel processing (`getImageData`), creating a `Uint32Array` buffer view and using a 1024-entry byte clamp lookup table (`clampTable`) reduces per-pixel execution time by ~35-40%. However, attempting to build a large 65,536-entry LUT for composite luminance tone deltas caused cache miss overhead that degraded performance on modern JS engines.
**Action:** Prefer 32-bit pixel packing and small clamping lookup tables for per-pixel operations; avoid oversized multi-channel LUTs.
