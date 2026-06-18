import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateFloat, validateInt, ValidationError } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || ''

const PUBLIC_FIELDS = [
  'id', 'slug', 'canonical_name', 'state', 'state_abbr', 'town', 'park',
  'lat', 'lon', 'swimming_quality', 'is_waterfall', 'is_swimming_hole',
  'cost', 'private_property', 'rating', 'waterfall_type',
].join(',')

function corsHeaders(origin: string | null) {
  const isAllowed = !ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN
  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const sp = req.nextUrl.searchParams

  try {
    const lat = validateFloat(sp.get('lat'), 'lat', { min: -90, max: 90 })
    const lon = validateFloat(sp.get('lon'), 'lon', { min: -180, max: 180 })
    const radius = validateInt(sp.get('radius'), 'radius', { min: 1, max: 150, defaultValue: 25 })
    const limit = validateInt(sp.get('limit'), 'limit', { min: 1, max: 50, defaultValue: 20 })

    const { data, error } = await supabase
      .from('spots')
      .select(PUBLIC_FIELDS)
      .not('lat', 'is', null)
      .not('lon', 'is', null)

    if (error) {
      console.error('[/api/spots/nearby]', error)
      return NextResponse.json(
        { error: 'Failed to fetch nearby spots' },
        { status: 500, headers: corsHeaders(origin) }
      )
    }

    type RawSpot = { lat: number; lon: number; [key: string]: unknown }
    const nearby = ((data ?? []) as RawSpot[])
      .map((spot) => ({
        ...spot,
        dist_km: haversineKm(lat, lon, spot.lat, spot.lon),
        is_approximate: false,
      }))
      .filter((s) => s.dist_km <= radius)
      .sort((a, b) => a.dist_km - b.dist_km)
      .slice(0, limit)

    return NextResponse.json(
      { data: nearby, total: nearby.length },
      {
        headers: {
          ...corsHeaders(origin),
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400, headers: corsHeaders(origin) }
      )
    }
    console.error('[/api/spots/nearby] unexpected', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }
}
