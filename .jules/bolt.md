## 2025-02-23 - Float32Array LUT for Per-Pixel Pixel Calculations
**Learning:** Pre-computing a 65,281-element `Float32Array` lookup table (LUT) for luminance-based tone delta adjustments across 1.9M+ image pixels in V8/Node JS was ~4% slower than computing simple inline math per pixel. Random-access memory lookups into a ~261KB typed array can introduce cache misses that exceed the CPU cost of basic floating-point arithmetic.
**Action:** Always benchmark typed-array LUT lookups vs inline math for large pixel loops in JS before committing.
