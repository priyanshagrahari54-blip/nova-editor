## 2026-10-19 - Fast Look-Up Table (LUT) for Per-Pixel Canvas Tone Adjustments

**Learning:** In canvas pixel manipulation routines operating on 8-bit RGBA channels (such as `getImageData`), calculating non-linear curves/weights (e.g. shadow/highlight tone deltas) per pixel leads to millions of redundant floating-point calculations per frame. Since the luma/tone inputs are strictly bounded 8-bit values (0–255), precomputing a 256-entry `Float32Array` LUT outside the pixel loop reduces execution time noticeably without loss of visual precision.

**Action:** When working on pixel manipulation or image processing loops in canvas contexts, identify bounded 8-bit input domains and replace inner-loop non-linear math with 256-entry precalculated LUTs.
