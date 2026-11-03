# Bolt Performance Journal

## 2026-09-06 - Timeline Component Re-render Churn During High-Frequency Playhead Updates
**Learning:** Video timeline playback triggers `timeupdate` events at 30-60 Hz, propagating `currentTime` state down to `ProfessionalTimeline`. Child elements that derive visuals from `duration` (such as static audio waveform bars or ruler marks) will repeatedly re-run procedural generation (e.g. `Math.sin`, template strings, and JSX object allocation for hundreds of DOM nodes) on every single tick if not memoized.
**Action:** Always memoize duration-bound track visualizations (`useMemo(..., [safeDuration])`) so that high-frequency playhead positioning only re-renders the playhead indicator line without recomputing track geometries or recreating VNodes.
