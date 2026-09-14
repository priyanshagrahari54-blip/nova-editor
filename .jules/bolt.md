# Bolt Performance Journal

## 2026-09-14 - Precomputed LUT for Canvas Pixel Luminance Adjustments
**Learning:** In canvas pixel processing functions operating on `ImageData.data` (Uint8ClampedArray), luma weighted integer sums (e.g. `red * 54 + green * 183 + blue * 19`) produce a strictly bounded integer range (`0` to `65280`). Pre-computing tone adjustments into a static `Float32Array(65281)` lookup table eliminates expensive floating-point normalization and non-linear weight calculation inside the per-pixel loop, speeding up execution without any precision loss.
**Action:** When performing pixel-level tone/curve operations, evaluate integer index lookup tables (sized to max luma/channel range) before running floating-point math inside millions-iteration loops.
