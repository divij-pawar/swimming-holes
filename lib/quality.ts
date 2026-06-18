import type { SwimmingQuality } from './types'

export const QUALITY_ORDER: Record<string, number> = {
  Outstanding: 6,
  Excellent: 5,
  Good: 4,
  Yes: 3,
  Fair: 2,
  Poor: 1,
  No: -1,
}

export function qualityColor(q: SwimmingQuality | null | undefined): string {
  switch (q) {
    case 'Outstanding':
    case 'Excellent':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    case 'Good':
    case 'Yes':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    case 'Fair':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    case 'Poor':
    case 'No':
      return 'bg-red-500/20 text-red-300 border-red-500/40'
    default:
      return 'bg-stone-700/50 text-stone-400 border-stone-600/40'
  }
}

export function qualityDot(q: SwimmingQuality | null | undefined): string {
  switch (q) {
    case 'Outstanding':
    case 'Excellent':
      return '#10b981'
    case 'Good':
    case 'Yes':
      return '#14b8a6'
    case 'Fair':
      return '#f59e0b'
    case 'Poor':
    case 'No':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}

export function qualityLabel(q: SwimmingQuality | null | undefined): string {
  if (!q) return 'Unknown'
  return q
}

export function isFree(cost: string | null | undefined): boolean | null {
  if (!cost) return null
  const t = cost.toLowerCase()
  if (t === 'none' || t === 'free' || t.includes('free') || t === 'no fee') return true
  if (t === 'unknown') return null
  return false
}

export function costLabel(cost: string | null | undefined): string {
  if (!cost || cost.toLowerCase() === 'unknown') return 'Unknown'
  const f = isFree(cost)
  if (f === true) return 'Free'
  if (f === false) return 'Fee'
  return 'Unknown'
}

export function costColor(cost: string | null | undefined): string {
  const f = isFree(cost)
  if (f === true) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (f === false) return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  return 'bg-stone-700/50 text-stone-400 border-stone-600/40'
}
