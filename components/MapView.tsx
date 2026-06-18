'use client'

import { useEffect, useRef } from 'react'
import type { SpotSummary } from '@/lib/types'
import { qualityDot } from '@/lib/quality'

// Leaflet is loaded dynamically to avoid SSR issues
// This component must be imported with dynamic(() => ..., { ssr: false })

interface Props {
  spots: SpotSummary[]
  userLat?: number
  userLon?: number
  radiusKm?: number
  onMarkerHover?: (slug: string | null) => void
  onMarkerClick?: (slug: string) => void
  highlightedSlug?: string
}

export default function MapView({
  spots,
  userLat,
  userLon,
  radiusKm,
  onMarkerHover,
  onMarkerClick,
  highlightedSlug,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<globalThis.Map<string, any>>(new globalThis.Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radiusCircleRef = useRef<any>(null)

  // Init map once
  useEffect(() => {
    // Wait for the container to be available
    if (!containerRef.current) return

    // Do not initialize if already initialized
    if (mapRef.current) return

    // Create abort controller to cancel init if component unmounts
    const abortController = new AbortController()
    let isMounted = true

    async function init() {
      // Abort if unmounted or component unmounted before we got here
      if (abortController.signal.aborted || !isMounted) return
      if (!containerRef.current) return

      // Check if Leaflet already has a map on this DOM element
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)._leaflet_id != null) return

      const L = (await import('leaflet')).default
      
      // Check again after async import
      if (abortController.signal.aborted || !isMounted || !containerRef.current) return

      await import('leaflet/dist/leaflet.css')
      await import('leaflet.markercluster')
      await import('leaflet.markercluster/dist/MarkerCluster.css')
      await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

      // Final check before creating map
      if (abortController.signal.aborted || !isMounted || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)._leaflet_id != null) return

      const map = L.map(containerRef.current!, {
        center: [39.5, -98.35],
        zoom: 4,
        zoomControl: true,
      })
      mapRef.current = map

      // CartoDB dark tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM',
          maxZoom: 19,
        }
      ).addTo(map)

      // Marker cluster group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 55,
        disableClusteringAtZoom: 12,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      })
      clusterRef.current = cluster
      map.addLayer(cluster)
    }

    init()

    return () => {
      isMounted = false
      abortController.abort()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Update markers when spots change
  useEffect(() => {
    const map = mapRef.current
    const cluster = clusterRef.current
    if (!map || !cluster) return

    async function updateMarkers() {
      const L = (await import('leaflet')).default

      // Remove old markers
      cluster!.clearLayers()
      markersRef.current.clear()

      const gpsSpots = spots.filter((s) => s.lat != null && s.lon != null)

      gpsSpots.forEach((spot) => {
        const color = qualityDot(spot.swimming_quality)
        const isApprox = spot.is_approximate

        const marker = L.circleMarker([spot.lat!, spot.lon!], {
          radius: 7,
          fillColor: color,
          color: isApprox ? '#6b7280' : color,
          weight: isApprox ? 1.5 : 0,
          opacity: 1,
          fillOpacity: isApprox ? 0.4 : 0.85,
        })

        marker.bindPopup(
          `<div style="font-family:system-ui;color:#e7e5e4;background:#1c1917;padding:4px">
            <div style="font-weight:600;font-size:13px">${spot.canonical_name}</div>
            <div style="font-size:11px;color:#a8a29e;margin-top:2px">${spot.town?.split(',')[0] ?? ''}, ${spot.state_abbr ?? ''}</div>
            <div style="font-size:11px;margin-top:4px">${spot.swimming_quality ?? 'Unknown swimming quality'}</div>
            ${isApprox ? '<div style="font-size:10px;color:#6b7280;margin-top:2px">⚠ Approximate location</div>' : ''}
          </div>`,
          { className: 'dark-popup' }
        )

        marker.on('mouseover', () => onMarkerHover?.(spot.slug))
        marker.on('mouseout', () => onMarkerHover?.(null))
        marker.on('click', () => onMarkerClick?.(spot.slug))

        cluster!.addLayer(marker)
        markersRef.current.set(spot.slug, marker)
      })
    }

    updateMarkers()
  }, [spots, onMarkerHover, onMarkerClick])

  // Highlight active marker
  useEffect(() => {
    markersRef.current.forEach((marker, slug) => {
      if (slug === highlightedSlug) {
        marker.setStyle({ weight: 2.5, color: '#ffffff', radius: 9 })
        marker.bringToFront()
      } else {
        const spot = spots.find((s) => s.slug === slug)
        const color = qualityDot(spot?.swimming_quality)
        marker.setStyle({ weight: 0, color, radius: 7 })
      }
    })
  }, [highlightedSlug, spots])

  // User location dot + radius circle
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    async function updateUser() {
      const L = (await import('leaflet')).default

      userMarkerRef.current?.remove()
      radiusCircleRef.current?.remove()

      if (userLat != null && userLon != null) {
        userMarkerRef.current = L.circleMarker([userLat, userLon], {
          radius: 8,
          fillColor: '#38bdf8',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map!)
        userMarkerRef.current.bindPopup('You are here')

        if (radiusKm) {
          radiusCircleRef.current = L.circle([userLat, userLon], {
            radius: radiusKm * 1000,
            color: '#38bdf8',
            weight: 1.5,
            fillColor: '#38bdf8',
            fillOpacity: 0.06,
          }).addTo(map!)
        }

        map!.flyTo([userLat, userLon], 9, { duration: 1 })
      }
    }

    updateUser()
  }, [userLat, userLon, radiusKm])

  return (
    <>
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #1c1917;
          border: 1px solid #44403c;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .dark-popup .leaflet-popup-tip { background: #1c1917; }
        .leaflet-control-zoom a { background: #1c1917 !important; border-color: #44403c !important; color: #e7e5e4 !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #78716c !important; }
        .leaflet-control-attribution a { color: #a8a29e !important; }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  )
}
