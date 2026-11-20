export type BrandMemoryProfile = {
  brandName: string
  voice: string
  audience: string
  palette: string
  typography: string
  imageStyle: string
  prohibitedClaims: string
  approvedExamples: string
  updatedAt: number
}

export const emptyBrandMemory: BrandMemoryProfile = {
  brandName: '', voice: '', audience: '', palette: '', typography: '',
  imageStyle: '', prohibitedClaims: '', approvedExamples: '', updatedAt: 0
}

const STORAGE_KEY = 'nova-brand-memory-v1'

export function loadBrandMemory(): BrandMemoryProfile {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value ? { ...emptyBrandMemory, ...JSON.parse(value) } : emptyBrandMemory
  } catch { return emptyBrandMemory }
}

export function saveBrandMemory(profile: BrandMemoryProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, updatedAt: Date.now() }))
}
