'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import clsx from 'clsx'

const QUALITY_OPTIONS = ['Outstanding', 'Excellent', 'Good', 'Yes', 'Fair', 'Poor', 'No']

const US_STATES = [
  ['AL','Alabama'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],
  ['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],
  ['ID','Idaho'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],
  ['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
]

interface Props {
  className?: string
}

export function FilterPanel({ className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback(
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

  const toggleQuality = useCallback(
    (val: string) => {
      const current = (searchParams.get('quality') || '').split(',').filter(Boolean)
      const next = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val]
      update('quality', next.join(',') || null)
    },
    [searchParams, update]
  )

  const state = searchParams.get('state') || ''
  const type = searchParams.get('type') || 'both'
  const quality = (searchParams.get('quality') || '').split(',').filter(Boolean)
  const cost = searchParams.get('cost') || 'any'
  const publicOnly = searchParams.get('public_only') === 'true'
  const hasNearMe = searchParams.has('lat') && searchParams.has('lon')
  const radius = searchParams.get('radius') || '25'

  const hasFilters = state || type !== 'both' || quality.length > 0 || cost !== 'any' || publicOnly || hasNearMe

  const clearAll = () => {
    router.push(pathname)
  }

  return (
    <div className={clsx('flex flex-col gap-5 p-4 text-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-stone-200">
          <SlidersHorizontal className="h-4 w-4 text-teal-400" />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded text-xs text-stone-400 hover:text-stone-200"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Near me active indicator */}
      {hasNearMe && (
        <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-teal-300 text-xs font-medium">Near Me — {radius} km radius</span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('lat')
                params.delete('lon')
                params.delete('radius')
                router.push(`${pathname}?${params.toString()}`)
              }}
              className="text-teal-400 hover:text-teal-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={parseInt(radius)}
            onChange={(e) => update('radius', e.target.value)}
            className="mt-2 w-full accent-teal-400"
          />
          <div className="flex justify-between text-xs text-stone-500 mt-0.5">
            <span>10 km</span><span>100 km</span>
          </div>
        </div>
      )}

      {/* State */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-400 uppercase tracking-wide">State</label>
        <select
          value={state}
          onChange={(e) => update('state', e.target.value || null)}
          className="w-full rounded-lg border border-stone-600 bg-stone-800 px-3 py-2 text-stone-100 focus:border-teal-400 focus:outline-none"
        >
          <option value="">All states</option>
          {US_STATES.map(([abbr, name]) => (
            <option key={abbr} value={abbr}>{name}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-400 uppercase tracking-wide">Type</label>
        <div className="flex gap-1.5">
          {(['both', 'swimming', 'waterfall'] as const).map((t) => (
            <button
              key={t}
              onClick={() => update('type', t === 'both' ? null : t)}
              className={clsx(
                'flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors',
                type === t
                  ? 'border-teal-400/60 bg-teal-500/20 text-teal-300'
                  : 'border-stone-600 bg-stone-800 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              )}
            >
              {t === 'both' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Swimming quality */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-400 uppercase tracking-wide">Swimming Quality</label>
        <div className="flex flex-col gap-1">
          {QUALITY_OPTIONS.map((q) => (
            <label key={q} className="flex cursor-pointer items-center gap-2.5 rounded px-1 py-0.5 hover:bg-stone-700/50">
              <input
                type="checkbox"
                checked={quality.includes(q)}
                onChange={() => toggleQuality(q)}
                className="h-3.5 w-3.5 rounded border-stone-600 bg-stone-800 accent-teal-400"
              />
              <span className={clsx('text-xs', quality.includes(q) ? 'text-stone-100' : 'text-stone-400')}>{q}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cost */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-400 uppercase tracking-wide">Cost</label>
        <div className="flex gap-1.5">
          {(['any', 'free', 'paid'] as const).map((c) => (
            <button
              key={c}
              onClick={() => update('cost', c === 'any' ? null : c)}
              className={clsx(
                'flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors',
                cost === c
                  ? 'border-teal-400/60 bg-teal-500/20 text-teal-300'
                  : 'border-stone-600 bg-stone-800 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Exclude private */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={publicOnly}
          onChange={(e) => update('public_only', e.target.checked ? 'true' : null)}
          className="h-4 w-4 rounded border-stone-600 bg-stone-800 accent-teal-400"
        />
        <span className="text-xs text-stone-300">Exclude private property</span>
      </label>
    </div>
  )
}
