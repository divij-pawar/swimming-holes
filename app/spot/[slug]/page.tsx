import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Waves, Droplets, Star, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react'
import { QualityBadge } from '@/components/QualityBadge'
import { GPSCard } from '@/components/GPSCard'
import { WeatherWidget } from '@/components/WeatherWidget'
import { SpotCard } from '@/components/SpotCard'
import { costColor, costLabel } from '@/lib/quality'
import { supabase } from '@/lib/supabase'
import type { SpotFull, SpotSummary } from '@/lib/types'
import type { Metadata } from 'next'
import clsx from 'clsx'

export const revalidate = 86400

const PUBLIC_FIELDS = [
  'id', 'slug', 'canonical_name', 'state', 'state_abbr', 'town', 'park',
  'lat', 'lon', 'swimming_quality', 'is_waterfall', 'is_swimming_hole',
  'cost', 'private_property', 'rating', 'description',
  'waterfall_type', 'water_source', 'sources', 'source_urls',
].join(',')

async function getSpot(slug: string): Promise<SpotFull | null> {
  try {
    const { data, error } = await supabase
      .from('spots')
      .select(PUBLIC_FIELDS)
      .eq('slug', slug)
      .single()
    
    if (error) {
      console.error('[spot page getSpot]', error)
      return null
    }
    return data
  } catch (err) {
    console.error('[spot page getSpot] unexpected', err)
    return null
  }
}

async function getNearby(lat: number, lon: number, excludeSlug: string): Promise<SpotSummary[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/spots/nearby?lat=${lat}&lon=${lon}&radius=20&limit=6`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      console.error('[spot page getNearby] fetch failed:', res.status, res.statusText)
      return []
    }
    const json = await res.json()
    return (json.data || []).filter((s: SpotSummary) => s.slug !== excludeSlug).slice(0, 5)
  } catch (err) {
    console.error('[spot page getNearby] error:', err)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const spot = await getSpot(slug)
  if (!spot) return { title: 'Not Found' }
  return {
    title: `${spot.canonical_name} — Swimming Holes`,
    description: spot.description?.slice(0, 160) || `${spot.canonical_name} in ${spot.state}`,
  }
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const spot = await getSpot(slug)
  if (!spot) notFound()

  const nearby =
    spot.lat && spot.lon ? await getNearby(spot.lat, spot.lon, spot.slug) : []

  return (
    <main className="mx-auto max-w-screen-lg px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-300">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {spot.state_abbr && (
          <>
            <Link href={`/state/${spot.state_abbr.toLowerCase()}`} className="hover:text-stone-300">
              {spot.state}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-stone-400 truncate">{spot.canonical_name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <div>
            {/* Private property warning */}
            {spot.private_property && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-500/50 bg-orange-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                <div>
                  <div className="font-semibold text-orange-300">Private Property</div>
                  <div className="mt-0.5 text-sm text-orange-300/80">
                    This spot may be on private land. Always verify access and obtain permission before visiting.
                  </div>
                </div>
              </div>
            )}

            <h1 className="text-3xl font-black text-stone-100 leading-tight">
              {spot.canonical_name}
            </h1>

            {/* Location line */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-stone-400 text-sm">
              {spot.town && <span>{spot.town.split(',')[0]}</span>}
              {spot.town && spot.state && <span>·</span>}
              {spot.state && (
                <Link href={`/state/${spot.state_abbr?.toLowerCase() ?? ''}`} className="hover:text-teal-300">
                  {spot.state}
                </Link>
              )}
              {spot.park && <span className="text-stone-500">· {spot.park}</span>}
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <QualityBadge quality={spot.swimming_quality} size="lg" />
              {spot.is_swimming_hole && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-sm text-teal-300">
                  <Waves className="h-3.5 w-3.5" /> Swimming Hole
                </span>
              )}
              {spot.is_waterfall && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300">
                  <Droplets className="h-3.5 w-3.5" /> Waterfall
                </span>
              )}
              {spot.cost && (
                <span className={clsx('inline-flex items-center rounded-full border px-3 py-1.5 text-sm', costColor(spot.cost))}>
                  {costLabel(spot.cost)}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 rounded-xl border border-stone-700 bg-stone-800/50 p-4 text-sm">
            {spot.rating != null && (
              <Stat label="Rating" value={
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {spot.rating.toFixed(1)} / 5.0
                </span>
              } />
            )}
            {spot.waterfall_type && <Stat label="Type" value={spot.waterfall_type} />}
            {spot.water_source && <Stat label="Water Source" value={spot.water_source} />}
          </div>

          {/* Description */}
          {spot.description && (
            <div className="rounded-xl border border-stone-700 bg-stone-800/30 p-6">
              <h2 className="mb-3 font-semibold text-stone-200">About</h2>
              <p className="max-w-prose text-base leading-relaxed text-stone-300 whitespace-pre-line">
                {spot.description}
              </p>
            </div>
          )}

          {/* Sources */}
          {spot.sources && spot.sources.length > 0 && (
            <div className="rounded-xl border border-stone-800 p-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Sources</h3>
              <div className="flex flex-wrap gap-2">
                {spot.sources.map((src, i) => (
                  <a
                    key={i}
                    href={spot.source_urls?.[i] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    {src}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Nearby spots */}
          {nearby.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-stone-200">Nearby Spots</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {nearby.map((s) => (
                  <div key={s.slug} className="w-56 shrink-0">
                    <SpotCard spot={s} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <GPSCard lat={spot.lat} lon={spot.lon} name={spot.canonical_name} town={spot.town} />
          {spot.lat && spot.lon && (
            <WeatherWidget lat={spot.lat} lon={spot.lon} />
          )}
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-stone-500 mb-0.5">{label}</div>
      <div className="text-stone-200">{value}</div>
    </div>
  )
}
