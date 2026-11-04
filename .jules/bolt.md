# Bolt Performance Journal

## 2026-11-04 - Memoize Inspector Sub-panels Against High-Frequency Adjustment Renders
**Learning:** In media editing applications where top-level editor settings (like exposure, brightness, temperature, tint) change continuously during drag interactions, inspector sub-panels (like transform, crop, and aspect ratio toolbars) re-render needlessly on every frame even when their props (`rotation`, `cropMode`, `cropAspect`) have not changed.
**Action:** Wrap secondary sidebar sub-panels that rely only on a subset of settings in `React.memo` to eliminate unnecessary DOM reconcile cycles during continuous slider manipulation.
