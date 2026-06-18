'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export interface SpotFilters {
  q: string
  state: string
  type: 'swimming' | 'waterfall' | 'both'
  quality: string[]
  cost: 'free' | 'paid' | 'any'
  publicOnly: boolean
  lat: number | null
  lon: number | null
  radius: number
  offset: number
}

export function useSpotFilters(): SpotFilters & {
  buildQuery: (overrides?: Partial<SpotFilters>) => string
} {
  const searchParams = useSearchParams()

  const q = searchParams.get('q') || ''
  const state = searchParams.get('state') || ''
  const typeRaw = searchParams.get('type') || 'both'
  const type = (['swimming', 'waterfall', 'both'].includes(typeRaw) ? typeRaw : 'both') as SpotFilters['type']
  const quality = (searchParams.get('quality') || '').split(',').filter(Boolean)
  const costRaw = searchParams.get('cost') || 'any'
  const cost = (['free', 'paid', 'any'].includes(costRaw) ? costRaw : 'any') as SpotFilters['cost']
  const publicOnly = searchParams.get('public_only') === 'true'
  const latRaw = searchParams.get('lat')
  const lonRaw = searchParams.get('lon')
  const lat = latRaw ? parseFloat(latRaw) : null
  const lon = lonRaw ? parseFloat(lonRaw) : null
  const radius = parseInt(searchParams.get('radius') || '25', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const buildQuery = useCallback(
    (overrides: Partial<SpotFilters> = {}) => {
      const merged = { q, state, type, quality, cost, publicOnly, lat, lon, radius, offset, ...overrides }
      const params = new URLSearchParams()
      if (merged.q) params.set('q', merged.q)
      if (merged.state) params.set('state', merged.state)
      if (merged.type !== 'both') params.set('type', merged.type)
      if (merged.quality.length) params.set('quality', merged.quality.join(','))
      if (merged.cost !== 'any') params.set('cost', merged.cost)
      if (merged.publicOnly) params.set('public_only', 'true')
      if (merged.lat != null) params.set('lat', String(merged.lat))
      if (merged.lon != null) params.set('lon', String(merged.lon))
      if (merged.radius !== 25) params.set('radius', String(merged.radius))
      if (merged.offset) params.set('offset', String(merged.offset))
      return params.toString()
    },
    [q, state, type, quality, cost, publicOnly, lat, lon, radius, offset]
  )

  return { q, state, type, quality, cost, publicOnly, lat, lon, radius, offset, buildQuery }
}

export function useFilterUpdater() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      params.delete('offset')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )
}
