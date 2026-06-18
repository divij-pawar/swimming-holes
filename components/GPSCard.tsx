'use client'

import { useState } from 'react'
import { Copy, Check, Navigation, MapPin } from 'lucide-react'

interface Props {
  lat: number | null
  lon: number | null
  name: string
  town?: string | null
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function GPSCard({ lat, lon, name, town }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!lat || !lon) return
    navigator.clipboard.writeText(`${lat}, ${lon}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const gmapsUrl = lat && lon
    ? `https://maps.google.com/?q=${lat},${lon}`
    : `https://maps.google.com/?q=${encodeURIComponent((town || '') + ' ' + name)}`

  const amapsUrl = lat && lon
    ? `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(name)}`
    : `https://maps.apple.com/?q=${encodeURIComponent((town || '') + ' ' + name)}`

  return (
    <div className="rounded-xl border border-stone-700 bg-stone-800 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-200">
        <Navigation className="h-4 w-4 text-teal-400" />
        Navigation
      </div>

      {lat && lon ? (
        <>
          <div className="mb-3 flex items-center justify-between rounded-lg bg-stone-700/50 px-3 py-2">
            <span className="font-mono text-sm text-teal-300">
              {lat.toFixed(5)}, {lon.toFixed(5)}
            </span>
            <button
              onClick={copy}
              className="ml-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-600 hover:text-stone-200 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-stone-700/30 px-3 py-2 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5" />
          No GPS on record — searching by town
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-stone-600 bg-stone-700 px-3 py-2 text-center text-xs font-medium text-stone-200 hover:bg-stone-600 transition-colors"
        >
          Google Maps
        </a>
        {isIOS() && (
          <a
            href={amapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-stone-600 bg-stone-700 px-3 py-2 text-center text-xs font-medium text-stone-200 hover:bg-stone-600 transition-colors"
          >
            Apple Maps
          </a>
        )}
      </div>
    </div>
  )
}
