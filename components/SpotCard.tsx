import Link from 'next/link'
import { MapPin, Waves, Droplets, Star, AlertTriangle } from 'lucide-react'
import { QualityBadge } from './QualityBadge'
import { costColor, costLabel } from '@/lib/quality'
import type { SpotSummary } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  spot: SpotSummary
  highlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function SpotCard({ spot, highlighted, onMouseEnter, onMouseLeave }: Props) {
  return (
    <Link
      href={`/spot/${spot.slug}`}
      className={clsx(
        'block rounded-xl border p-4 transition-all duration-150',
        'bg-stone-800 hover:bg-stone-750',
        highlighted
          ? 'border-teal-400/60 shadow-[0_0_0_1px_rgba(45,212,191,0.3)]'
          : 'border-stone-700 hover:border-stone-600'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-stone-100 leading-snug line-clamp-2">
          {spot.canonical_name}
        </h3>
        <QualityBadge quality={spot.swimming_quality} size="sm" />
      </div>

      {/* Location */}
      <div className="mt-1.5 flex items-center gap-1 text-xs text-stone-400">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {[spot.town?.split(',')[0], spot.state_abbr].filter(Boolean).join(', ')}
        </span>
        {spot.dist_km != null && (
          <span className="ml-auto shrink-0 text-stone-500">
            {spot.is_approximate ? '~' : ''}
            {spot.dist_km < 10
              ? spot.dist_km.toFixed(1)
              : Math.round(spot.dist_km)}{' '}
            km
          </span>
        )}
      </div>

      {/* Tags row */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {spot.is_swimming_hole && (
          <Tag icon={<Waves className="h-3 w-3" />} label="Swimming" color="teal" />
        )}
        {spot.is_waterfall && (
          <Tag icon={<Droplets className="h-3 w-3" />} label="Waterfall" color="blue" />
        )}
        {spot.cost && (
          <span
            className={clsx(
              'inline-flex items-center rounded border px-1.5 py-0.5 text-xs',
              costColor(spot.cost)
            )}
          >
            {costLabel(spot.cost)}
          </span>
        )}
        {spot.private_property && (
          <span className="inline-flex items-center gap-0.5 rounded border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 text-xs text-orange-300">
            <AlertTriangle className="h-3 w-3" />
            Private
          </span>
        )}
      </div>

      {/* Rating */}
      {spot.rating != null && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
          <Star className="h-3 w-3 fill-amber-400" />
          <span>{spot.rating.toFixed(1)}</span>
        </div>
      )}
    </Link>
  )
}

function Tag({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode
  label: string
  color: 'teal' | 'blue'
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs',
        color === 'teal' &&
          'border-teal-500/40 bg-teal-500/10 text-teal-300',
        color === 'blue' &&
          'border-blue-500/40 bg-blue-500/10 text-blue-300'
      )}
    >
      {icon}
      {label}
    </span>
  )
}
