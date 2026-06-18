import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || ''

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

  const { data, error } = await supabase
    .from('states_meta')
    .select('state_abbr,state,total_count,swimming_count,waterfall_count,centroid_lat,centroid_lon')
    .order('total_count', { ascending: false })

  if (error) {
    console.error('[/api/states]', error)
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }

  return NextResponse.json(data ?? [], {
    headers: {
      ...corsHeaders(origin),
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=900',
    },
  })
}
