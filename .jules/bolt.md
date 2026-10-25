# Bolt Performance Journal

## 2026-10-25 - Uint32Array 32-bit View for Canvas ImageData Pixel Loops
**Learning:** Indexing `Uint8ClampedArray` frame data four times per pixel (`pixels[i]`, `pixels[i+1]`, `pixels[i+2]`, `pixels[i+3]`) introduces property access overhead in V8 loop bodies. Creating a `Uint32Array` view over `frame.data.buffer` allows accessing and writing entire 32-bit pixel words in a single array indexing operation per pixel, extracting color channels via bitwise operations (`& 0xff`, `>> 8`, `>> 16`).
**Action:** For hot canvas pixel loops processing large buffers (e.g. 1600x1200 or higher), use `new Uint32Array(frame.data.buffer)` to iterate through pixels 1 word at a time, resulting in ~17% speedup (~33ms down to ~27ms per frame).
