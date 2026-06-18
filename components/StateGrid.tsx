import Link from 'next/link'
import type { StateMeta } from '@/lib/types'

interface Props {
  states: StateMeta[]
}

const STATE_COLORS = [
  'from-teal-900/40 to-teal-800/20 border-teal-700/30',
  'from-blue-900/40 to-blue-800/20 border-blue-700/30',
  'from-emerald-900/40 to-emerald-800/20 border-emerald-700/30',
  'from-cyan-900/40 to-cyan-800/20 border-cyan-700/30',
]

export function StateGrid({ states }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {states.map((s, i) => (
        <Link
          key={s.state_abbr}
          href={`/state/${s.state_abbr.toLowerCase()}`}
          className={`group rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${STATE_COLORS[i % STATE_COLORS.length]}`}
        >
          <div className="text-2xl font-black text-stone-100 group-hover:text-teal-300 transition-colors">
            {s.state_abbr}
          </div>
          <div className="mt-0.5 text-xs text-stone-400 leading-tight">{s.state}</div>
          <div className="mt-2 text-xs text-stone-500">
            <span className="text-stone-300 font-medium">{s.total_count}</span> spots
          </div>
          <div className="mt-0.5 flex gap-2 text-xs text-stone-500">
            <span>{s.swimming_count} swim</span>
            <span>·</span>
            <span>{s.waterfall_count} falls</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
