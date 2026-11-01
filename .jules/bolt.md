# Bolt's Performance Journal

## 2026-09-06 - Memoize High-Frequency Playhead Sub-Tree Calculations
**Learning:** In timeline components driven by playback events (e.g. `timeupdate` updating `currentTime` 30-60+ times per second), child visualization elements such as audio waveform bars that only depend on duration or track length will re-allocate arrays and re-evaluate trigonometric formulas (`Math.sin`) and CSS string properties on every frame tick unless explicitly memoized.
**Action:** Always memoize static track geometry, tick arrays, and waveform data with `useMemo` keyed on duration / clip length so continuous playback updates only re-render the lightweight playhead indicator.
