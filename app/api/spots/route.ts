import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  validateInt,
  validateStates,
  validateQuality,
  validateEnum,
  validateSearchQuery,
  ValidationError,
} from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || ''
const TYPE_VALUES = ['swimming', 'waterfall', 'both'] as const
const COST_VALUES = ['free', 'paid', 'any'] as const
const SORT_VALUES = ['rating', 'distance'] as const

// Fields returned to clients — never SELECT * to avoid leaking internal fields
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

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const sp = req.nextUrl.searchParams

  try {
    const q = validateSearchQuery(sp.get('q'))
    const states = validateStates(sp.get('state'))
    const type = validateEnum(sp.get('type'), 'type', TYPE_VALUES, 'both')
    const quality = validateQuality(sp.get('quality'))
    const cost = validateEnum(sp.get('cost'), 'cost', COST_VALUES, 'any')
    const sort = validateEnum(sp.get('sort'), 'sort', SORT_VALUES, 'rating')
    const publicOnly = sp.get('public_only') === 'true'
    const offset = validateInt(sp.get('offset'), 'offset', { min: 0, max: 10_000 })
    // Cap at 50 per page — harder to dump full DB (12 pages instead of 5)
    const limit = validateInt(sp.get('limit'), 'limit', { min: 1, max: 50, defaultValue: 20 })

    let query = supabase
      .from('spots')
      .select(PUBLIC_FIELDS, { count: 'exact' })

    if (q) {
      query = query.textSearch('search_vector', q, { type: 'websearch', config: 'english' })
    }
    if (states.length > 0) query = query.in('state_abbr', states)
    if (type === 'swimming') query = query.eq('is_swimming_hole', true)
    if (type === 'waterfall') query = query.eq('is_waterfall', true)
    if (quality.length > 0) query = query.in('swimming_quality', quality)
    if (cost === 'free') {
      query = query.or('cost.ilike.%free%,cost.ilike.%none%,cost.eq.Free,cost.eq.None')
    } else if (cost === 'paid') {
      query = query.not('cost', 'ilike', '%free%').not('cost', 'ilike', '%none%').not('cost', 'is', null)
    }
    if (publicOnly) query = query.or('private_property.is.null,private_property.eq.false')

    // Apply sorting
    if (sort === 'distance') {
      // Distance sorting requires lat/lon from query params (handled client-side in near-me)
      query = query.order('lat', { ascending: false })
    } else {
      query = query.order('rating', { ascending: false, nullsFirst: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error('[/api/spots] Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        params: { states, type, quality, cost, sort, offset, limit },
      })
      return NextResponse.json(
        { error: 'Failed to fetch spots' },
        { status: 500, headers: corsHeaders(origin) }
      )
    }

    return NextResponse.json(
      { data: data ?? [], total: count ?? 0, has_more: (count ?? 0) > offset + limit },
      {
        headers: {
          ...corsHeaders(origin),
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
    console.error('[/api/spots] unexpected', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }
}
