# Bolt Performance Journal

## 2026-08-30 - Uint8ClampedArray Native Clamping vs JS Clamp Helpers
**Learning:** Calling custom JS clamping helpers (e.g., `value < 0 ? 0 : value > 255 ? 255 : (value + 0.5) | 0`) inside high-frequency per-pixel loops (1M+ iterations per frame) adds overhead compared to assigning numbers directly to `Uint8ClampedArray`. Modern JS engines (V8, JavaScriptCore) perform automatic rounding and clamping to `[0, 255]` natively in C++ when writing to a `Uint8ClampedArray`.
**Action:** In Canvas pixel manipulation routines using `Uint8ClampedArray`, write calculated RGB values directly to `pixels[i]` without manual JS clamping functions or bitwise rounding.
