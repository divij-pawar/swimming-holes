'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { SpotCard } from '@/components/SpotCard'
import { FilterPanel } from '@/components/FilterPanel'
import { Map as MapIcon, List, SlidersHorizontal, X } from 'lucide-react'
import type { SpotSummary, SpotsResponse } from '@/lib/types'
import clsx from 'clsx'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <MapSkeleton /> })

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse bg-stone-800" />
}

function ExploreInner() {
  const searchParams = useSearchParams()
  const [spots, setSpots] = useState<SpotSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef(new Map<string, HTMLDivElement>())

  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined
  const radius = parseInt(searchParams.get('radius') || '25', 10)

  // Build API query from current search params (excluding offset)
  const buildApiUrl = useCallback(
    (newOffset = 0) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('offset', String(newOffset))
      params.set('limit', '20')
      // If near-me, use nearby endpoint
      if (lat != null && lon != null) {
        return `/api/spots/nearby?lat=${lat}&lon=${lon}&radius=${radius}&limit=50`
      }
      return `/api/spots?${params.toString()}`
    },
    [searchParams, lat, lon, radius]
  )

  // Fetch initial page when filters change
  useEffect(() => {
    setLoading(true)
    setOffset(0)
    setSpots([])
    fetch(buildApiUrl(0))
      .then((r) => r.json())
      .then((json: SpotsResponse) => {
        setSpots(json.data)
        setTotal(json.total)
        setHasMore(json.has_more ?? false)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [searchParams.toString()]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || lat != null) return
    const nextOffset = offset + 20
    setLoadingMore(true)
    fetch(buildApiUrl(nextOffset))
      .then((r) => r.json())
      .then((json: SpotsResponse) => {
        setSpots((prev) => [...prev, ...json.data])
        setOffset(nextOffset)
        setHasMore(json.has_more ?? false)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [loadingMore, hasMore, lat, offset, buildApiUrl])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [loadMore])

  const handleMarkerClick = (slug: string) => {
    setHighlightedSlug(slug)
    const el = cardRefs.current.get(slug)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setShowMap(false) // on mobile, switch to list
  }

  const gpsSpots = spots.filter((s) => s.lat != null && s.lon != null)
  const listOnlyCount = spots.length - gpsSpots.length

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Filter sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-stone-800 bg-stone-900 lg:block">
        <Suspense>
          <FilterPanel />
        </Suspense>
      </aside>

      {/* List panel */}
      <div
        className={clsx(
          'flex flex-1 flex-col overflow-hidden',
          showMap && 'hidden lg:flex'
        )}
      >
        {/* List header */}
        <div className="flex items-center gap-2 border-b border-stone-800 bg-stone-900 px-4 py-2.5">
          <span className="text-sm text-stone-400">
            {loading ? 'Loading…' : `${total.toLocaleString()} spots`}
          </span>
          <div className="ml-auto flex gap-2">
            {/* Mobile filter button */}
            <button
              className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 lg:hidden"
              onClick={() => setShowFilter(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
            {/* Mobile map toggle */}
            <button
              className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 lg:hidden"
              onClick={() => setShowMap(true)}
            >
              <MapIcon className="h-3.5 w-3.5" />
              Map
            </button>
          </div>
        </div>

        {/* Spot list */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-800" />
              ))}
            </>
          )}

          {!loading && spots.length === 0 && (
            <div className="py-16 text-center text-stone-500">
              <Waves className="mx-auto mb-3 h-8 w-8" />
              No spots found. Try adjusting your filters.
            </div>
          )}

          {spots.map((spot) => (
            <div
              key={spot.slug}
              ref={(el) => {
                if (el) cardRefs.current.set(spot.slug, el)
                else cardRefs.current.delete(spot.slug)
              }}
            >
              <SpotCard
                spot={spot}
                highlighted={highlightedSlug === spot.slug}
                onMouseEnter={() => setHighlightedSlug(spot.slug)}
                onMouseLeave={() => setHighlightedSlug(null)}
              />
            </div>
          ))}

          {/* List-only count notice */}
          {listOnlyCount > 0 && !loading && (
            <p className="py-3 text-center text-xs text-stone-600">
              {listOnlyCount} spots above have no GPS and are list-only
            </p>
          )}

          <div ref={sentinelRef} className="h-4" />
          {loadingMore && <div className="h-10 animate-pulse rounded-lg bg-stone-800" />}
        </div>
      </div>

      {/* Map panel — desktop always visible, mobile toggleable */}
      <div
        className={clsx(
          'relative border-l border-stone-800',
          showMap ? 'flex-1' : 'hidden lg:block lg:flex-1'
        )}
      >
        {showMap && (
          <button
            className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900/90 px-3 py-1.5 text-xs text-stone-300 lg:hidden"
            onClick={() => setShowMap(false)}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        )}
        <MapView
          spots={gpsSpots}
          userLat={lat}
          userLon={lon}
          radiusKm={lat != null ? radius : undefined}
          onMarkerHover={setHighlightedSlug}
          onMarkerClick={handleMarkerClick}
          highlightedSlug={highlightedSlug ?? undefined}
        />
      </div>

      {/* Mobile filter drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilter(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-stone-900 pb-safe">
            <div className="flex items-center justify-between border-b border-stone-800 p-4">
              <span className="font-semibold text-stone-100">Filters</span>
              <button onClick={() => setShowFilter(false)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>
            <Suspense>
              <FilterPanel />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  )
}

// Workaround: Waves needs to be imported for the empty state inside ExploreInner
import { Waves } from 'lucide-react'

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-56px)] animate-pulse bg-stone-900" />}>
      <ExploreInner />
    </Suspense>
  )
}
