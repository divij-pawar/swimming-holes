import Link from 'next/link'
import { ChevronRight, Waves, Droplets, MapPin } from 'lucide-react'
import { SpotCard } from '@/components/SpotCard'
import type { SpotSummary, StateMeta } from '@/lib/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 3600

const STATE_NAMES: Record<string, string> = {
  al:'Alabama',az:'Arizona',ar:'Arkansas',ca:'California',co:'Colorado',
  ct:'Connecticut',de:'Delaware',fl:'Florida',ga:'Georgia',hi:'Hawaii',
  id:'Idaho',ks:'Kansas',ky:'Kentucky',la:'Louisiana',me:'Maine',
  md:'Maryland',ma:'Massachusetts',mi:'Michigan',mn:'Minnesota',ms:'Mississippi',
  mo:'Missouri',mt:'Montana',nv:'Nevada',nh:'New Hampshire',nj:'New Jersey',
  nm:'New Mexico',ny:'New York',nc:'North Carolina',oh:'Ohio',ok:'Oklahoma',
  or:'Oregon',pa:'Pennsylvania',ri:'Rhode Island',sc:'South Carolina',
  sd:'South Dakota',tn:'Tennessee',tx:'Texas',ut:'Utah',vt:'Vermont',
  va:'Virginia',wa:'Washington',wv:'West Virginia',wi:'Wisconsin',wy:'Wyoming',
}

async function getStateMeta(abbr: string): Promise<StateMeta | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/states`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const states: StateMeta[] = await res.json()
    return states.find((s) => s.state_abbr.toLowerCase() === abbr) ?? null
  } catch {
    return null
  }
}

async function getStateSpots(abbr: string): Promise<SpotSummary[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/spots?state=${abbr.toUpperCase()}&limit=100`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ abbr: string }>
}): Promise<Metadata> {
  const { abbr } = await params
  const name = STATE_NAMES[abbr.toLowerCase()] || abbr.toUpperCase()
  return {
    title: `${name} Swimming Holes & Waterfalls — Swimming Holes`,
    description: `Find swimming holes and waterfalls in ${name}. Explore spots with swimming quality ratings, GPS coordinates, and more.`,
  }
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ abbr: string }>
}) {
  const { abbr } = await params
  const lowerAbbr = abbr.toLowerCase()

  if (!STATE_NAMES[lowerAbbr]) notFound()

  const [meta, spots] = await Promise.all([
    getStateMeta(lowerAbbr),
    getStateSpots(lowerAbbr),
  ])

  const stateName = STATE_NAMES[lowerAbbr]
  const swimSpots = spots.filter((s) => s.is_swimming_hole)
  const waterfalls = spots.filter((s) => s.is_waterfall)

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-300">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-stone-400">{stateName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-100">
          {stateName}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-teal-400" />
            {meta?.total_count ?? spots.length} total spots
          </span>
          <span className="flex items-center gap-1.5">
            <Waves className="h-4 w-4 text-teal-400" />
            {swimSpots.length} swimming holes
          </span>
          <span className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-blue-400" />
            {waterfalls.length} waterfalls
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/explore?state=${lowerAbbr.toUpperCase()}`}
            className="rounded-lg border border-teal-500/40 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-teal-500/20 transition-colors"
          >
            View on Map
          </Link>
          <Link
            href={`/explore?state=${lowerAbbr.toUpperCase()}&type=swimming`}
            className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-300 hover:border-stone-600 transition-colors"
          >
            Swimming Only
          </Link>
        </div>
      </div>

      {/* Spots grid */}
      {spots.length === 0 ? (
        <p className="py-16 text-center text-stone-500">No spots found for this state.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {spots.map((spot) => (
            <SpotCard key={spot.slug} spot={spot} />
          ))}
        </div>
      )}
    </main>
  )
}
