export type StoredIssue = { id: number; title: string; label: string; priority: 'Critical' | 'High' | 'Normal'; status: 'Open' | 'Fixed' }

const key = 'nova-release-engine-issues'

export function loadIssues<T extends StoredIssue>(fallback: T[]) {
  try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as T[] : fallback } catch { return fallback }
}

export function saveIssues(issues: StoredIssue[]) {
  try { localStorage.setItem(key, JSON.stringify(issues)) } catch { /* storage may be disabled by the browser */ }
}
