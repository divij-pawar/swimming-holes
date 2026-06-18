import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateSlug, ValidationError } from '@/lib/validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || ''

// Explicit field list — never SELECT * on public endpoints
const PUBLIC_FIELDS = [
  'id', 'slug', 'canonical_name', 'state', 'state_abbr', 'town', 'park',
  'lat', 'lon', 'swimming_quality', 'is_waterfall', 'is_swimming_hole',
  'cost', 'private_property', 'rating', 'description',
  'waterfall_type', 'water_source', 'sources', 'source_urls',
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const origin = req.headers.get('origin')

  try {
    const { slug: rawSlug } = await params
    const slug = validateSlug(rawSlug)

    const { data, error } = await supabase
      .from('spots')
      .select(PUBLIC_FIELDS)
      .eq('slug', slug)
      .single()

    if (error || !data) {
      // Don't reveal whether it's a DB error vs. not found
      return NextResponse.json(
        { error: 'Spot not found' },
        { status: 404, headers: corsHeaders(origin) }
      )
    }

    return NextResponse.json(data, {
      headers: {
        ...corsHeaders(origin),
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400, headers: corsHeaders(origin) }
      )
    }
    console.error('[/api/spots/[slug]] unexpected', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }
}
