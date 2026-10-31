# Bolt Performance Journal

## 2026-03-31 - Redundant Pixel Clamping on Uint8ClampedArray
**Learning:** In canvas pixel manipulation loops, `ImageData.data` is an underlying `Uint8ClampedArray`. Manual clamping functions (such as `clampChannel` with conditional checks or `Math.max(0, Math.min(255, x))`) add millions of redundant branches and function calls per frame. Assigning values directly to `Uint8ClampedArray[index]` automatically clamps to `[0, 255]` and rounds to the nearest integer natively in C++/engine intrinsics.
**Action:** When manipulating `ImageData.data` in tight loops, assign float/number calculations directly to the array without userland clamping helpers.
