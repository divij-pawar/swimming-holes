import Link from 'next/link'
import { Waves } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center py-32 text-center">
      <Waves className="h-12 w-12 text-teal-400 mb-4" />
      <h1 className="text-2xl font-bold text-stone-100">Spot not found</h1>
      <p className="mt-2 text-stone-400">This location doesn&apos;t exist or may have moved.</p>
      <Link
        href="/explore"
        className="mt-6 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 transition-colors"
      >
        Browse All Spots
      </Link>
    </main>
  )
}
