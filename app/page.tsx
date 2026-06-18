import Link from 'next/link'
import { Waves, Droplets, MapPin, LocateFixed, ArrowRight } from 'lucide-react'
import { StateGrid } from '@/components/StateGrid'
import { NearMeButton } from '@/components/NearMeButton'
import { Suspense } from 'react'
import type { StateMeta } from '@/lib/types'

async function getStates(): Promise<StateMeta[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/states`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function HomePage() {
  const states = await getStates()

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-800 bg-gradient-to-b from-stone-900 to-stone-950 pb-20 pt-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">
            <Waves className="h-3 w-3" />
            1,145 spots across 44 states
          </div>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-100 sm:text-5xl md:text-6xl">
            Find your next
            <span className="block bg-gradient-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">
              swimming hole
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-400">
            Discover waterfalls and swimming holes near you. Filter by quality,
            cost, and access — perfect for spontaneous adventures.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Suspense>
              <NearMeButton className="h-11 px-5 text-sm" />
            </Suspense>
            <Link
              href="/explore"
              className="flex h-11 items-center gap-2 rounded-lg bg-teal-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
            >
              Browse All Spots
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 grid max-w-sm grid-cols-3 gap-4 text-center sm:max-w-md">
            <Stat value="888" label="Swimming Holes" />
            <Stat value="612" label="Waterfalls" />
            <Stat value="44" label="US States" />
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-b border-stone-800 bg-stone-900/50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            <Feature
              icon={<LocateFixed className="h-5 w-5 text-teal-400" />}
              title="Near Me"
              desc="Find spots within your chosen radius using your device's location."
            />
            <Feature
              icon={<Waves className="h-5 w-5 text-blue-400" />}
              title="Swimming Quality"
              desc="Color-coded ratings from Outstanding to Poor — know before you go."
            />
            <Feature
              icon={<MapPin className="h-5 w-5 text-emerald-400" />}
              title="GPS Navigation"
              desc="Copy coordinates or open directly in Google Maps or Apple Maps."
            />
          </div>
        </div>
      </section>

      {/* State grid */}
      {states.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-screen-xl px-4">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-stone-100">Browse by State</h2>
              <Link href="/explore" className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <StateGrid states={states} />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-stone-800 bg-gradient-to-t from-stone-950 to-stone-900 py-16 text-center">
        <Droplets className="mx-auto h-8 w-8 text-teal-400" />
        <h2 className="mt-4 text-2xl font-bold text-stone-100">Ready to dive in?</h2>
        <p className="mt-2 text-stone-400">Start exploring swimming holes and waterfalls near you.</p>
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-6 py-3 font-semibold text-white hover:bg-teal-400 transition-colors"
        >
          Explore the Map <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-stone-800 py-6 text-center text-xs text-stone-600">
        Always verify access and conditions before visiting.
      </footer>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-black text-teal-300">{value}</div>
      <div className="mt-0.5 text-xs text-stone-500">{label}</div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-stone-700 bg-stone-800/50 p-5">
      <div className="mb-3">{icon}</div>
      <div className="font-semibold text-stone-100">{title}</div>
      <div className="mt-1 text-sm text-stone-400">{desc}</div>
    </div>
  )
}
