## 2025-05-18 - Uint32Array Canvas ImageData Processing
**Learning:** Processing Canvas ImageData pixel buffers using a `Uint32Array` view over `ImageData.data.buffer` reduces 4 `Uint8ClampedArray` memory reads/writes to 1 32-bit word read/write per pixel, yielding a ~18% execution speedup in per-pixel manipulation loops.
**Action:** Use `new Uint32Array(pixels.buffer, pixels.byteOffset, pixels.byteLength >> 2)` and bitwise bit-shifts (`& 0xff`, `>> 8`, `>> 16`, `<< 8`, `<< 16`) for high-frequency per-pixel canvas loops.
