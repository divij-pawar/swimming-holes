'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LocateFixed, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export function NearMeButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isActive = searchParams.has('lat') && searchParams.has('lon')

  const handleClick = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus('idle')
        const params = new URLSearchParams(searchParams.toString())
        params.set('lat', pos.coords.latitude.toFixed(5))
        params.set('lon', pos.coords.longitude.toFixed(5))
        params.set('radius', params.get('radius') || '25')
        params.delete('offset')
        const target = pathname === '/' ? '/explore' : pathname
        router.push(`${target}?${params.toString()}`)
      },
      () => {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      title={
        status === 'error'
          ? 'Location unavailable — search by state instead'
          : isActive
          ? 'Near Me active'
          : 'Find spots near me'
      }
      className={clsx(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
        isActive
          ? 'border-teal-400/60 bg-teal-500/20 text-teal-300'
          : status === 'error'
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : 'border-stone-600 bg-stone-800 text-stone-300 hover:border-teal-400/40 hover:text-teal-300',
        className
      )}
    >
      {status === 'loading' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LocateFixed className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {status === 'error' ? 'Location unavailable' : 'Near Me'}
      </span>
    </button>
  )
}
