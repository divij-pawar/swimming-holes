import Link from 'next/link'
import { Waves } from 'lucide-react'
import { NearMeButton } from './NearMeButton'
import { Suspense } from 'react'

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-700 bg-stone-900/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-stone-100 hover:text-teal-300 transition-colors">
          <Waves className="h-5 w-5 text-teal-400" />
          <span className="font-bold text-sm tracking-tight">Swimming Holes</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link href="/explore" className="rounded-md px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors">
            Explore
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Suspense>
            <NearMeButton />
          </Suspense>
          <Link
            href="/explore"
            className="hidden md:inline-flex items-center rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-300 hover:bg-teal-500/20 transition-colors"
          >
            Browse All
          </Link>
        </div>
      </div>
    </header>
  )
}
