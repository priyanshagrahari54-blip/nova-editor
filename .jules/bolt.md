## 2026-10-14 - Timeline playback re-render allocations
**Learning:** High-frequency state updates like `currentTime` (30-60 fps during video playback) cause React components to re-render constantly. Unmemoized JSX element generation (like audio waveform bars and timeline tick marks) allocates hundreds of objects and inline styles per frame, creating GC pressure.
**Action:** Always memoize static track/ruler JSX arrays using `useMemo` when a component re-renders on high-frequency animation frames or time updates.
