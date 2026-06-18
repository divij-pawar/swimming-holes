/**
 * One-time seed script: reads master_all.json → Supabase spots table
 * Run: npx tsx scripts/seed.ts
 * Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATA_FILE = path.resolve(__dirname, '../../master_all.json')
const NOMINATIM_DELAY = 1100 // ms — Nominatim ToS: max 1 req/sec

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(name: string, stateAbbr: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${base}-${stateAbbr.toLowerCase()}`
}

function parseFloat2(val: unknown): number | null {
  if (!val) return null
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? null : n
}

function parseRating(val: unknown): number | null {
  if (!val) return null
  const m = String(val).match(/([\d.]+)/)
  if (!m) return null
  const n = parseFloat(m[1])
  return isNaN(n) ? null : n
}

function parsePrivate(val: unknown): boolean | null {
  if (!val) return null
  const t = String(val).toLowerCase()
  if (t.startsWith('yes') || t === 'true') return true
  if (t.startsWith('no') || t === 'false') return false
  return null
}

function parseSources(val: unknown): string[] {
  if (!val || String(val).trim() === '') return []
  return String(val).split('|').map((s) => s.trim()).filter(Boolean)
}

async function geocodeTown(town: string, stateAbbr: string): Promise<[number, number] | null> {
  // Try first town in comma-separated list
  const firstTown = town.split(',')[0].trim()
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(firstTown)}&state=${encodeURIComponent(stateAbbr)}&country=US&format=json&limit=1`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'swimming-holes-seed/1.0 (educational project)' },
    })
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
  } catch {
    // ignore
  }
  return null
}

async function main() {
  console.log('Reading master_all.json...')
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Record<string, unknown>[]
  console.log(`  ${raw.length} records`)

  // Build records
  const slugCount = new Map<string, number>()
  const records = raw.map((r) => {
    const stateAbbr = String(r.state_abbr || '').toUpperCase()
    let slug = slugify(String(r.canonical_name || 'unknown'), stateAbbr)
    // Deduplicate slugs
    const count = (slugCount.get(slug) || 0) + 1
    slugCount.set(slug, count)
    if (count > 1) slug = `${slug}-${count}`

    const lat = parseFloat2(r.lat)
    const lon = parseFloat2(r.lon)

    return {
      slug,
      canonical_name: String(r.canonical_name || ''),
      state: r.state ? String(r.state) : null,
      state_abbr: stateAbbr || null,
      town: r.town ? String(r.town) : null,
      park: r.park ? String(r.park) : null,
      lat,
      lon,
      swimming_quality: r.swimming_quality ? String(r.swimming_quality) : null,
      is_waterfall: Boolean(r.is_waterfall),
      is_swimming_hole: Boolean(r.is_swimming_hole),
      cost: r.cost ? String(r.cost) : null,
      private_property: parsePrivate(r.private_property),
      rating: parseRating(r.rating),
      description: r.description ? String(r.description) : null,
      waterfall_type: r.waterfall_type ? String(r.waterfall_type) : null,
      water_source: r.water_source ? String(r.water_source) : null,
      sources: parseSources(r.sources),
      source_urls: parseSources(r.source_urls),
      _town_key: r.town && stateAbbr && !lat ? `${String(r.town).split(',')[0].trim()}__${stateAbbr}` : null,
    }
  })

  // Upsert spots in batches of 100
  console.log('\nUpserting spots...')
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH).map(({ _town_key: _tk, ...r }) => r)
    const { error } = await supabase.from('spots').upsert(batch, { onConflict: 'slug' })
    if (error) {
      console.error(`  [batch ${i}] ERROR:`, error.message)
    } else {
      inserted += batch.length
      process.stdout.write(`  ${inserted}/${records.length}\r`)
    }
  }
  console.log(`\nUpserted ${inserted} spots.`)

  // Geocode town centroids for records without GPS
  const needCentroid = new Map<string, { town: string; stateAbbr: string }>()
  for (const r of records) {
    if (r._town_key && r.town && r.state_abbr) {
      needCentroid.set(r._town_key as string, { town: r.town, stateAbbr: r.state_abbr })
    }
  }

  console.log(`\nGeocoding ${needCentroid.size} unique towns for centroid fallback...`)
  let geocoded = 0
  const centroids: Array<{ town: string; state_abbr: string; lat: number; lon: number }> = []

  for (const [, { town, stateAbbr }] of needCentroid) {
    await sleep(NOMINATIM_DELAY)
    const result = await geocodeTown(town, stateAbbr)
    if (result) {
      centroids.push({ town: town.split(',')[0].trim(), state_abbr: stateAbbr, lat: result[0], lon: result[1] })
      geocoded++
      if (geocoded % 20 === 0) {
        process.stdout.write(`  ${geocoded}/${needCentroid.size}\r`)
      }
    }
  }
  console.log(`\nGeocoded ${geocoded} towns.`)

  if (centroids.length > 0) {
    for (let i = 0; i < centroids.length; i += BATCH) {
      const { error } = await supabase
        .from('town_centroids')
        .upsert(centroids.slice(i, i + BATCH), { onConflict: 'town,state_abbr' })
      if (error) console.error('  centroid upsert error:', error.message)
    }
    console.log('Town centroids saved.')
  }

  // Refresh materialized view
  console.log('\nRefreshing states_meta...')
  const { error: viewErr } = await supabase.rpc('refresh_states_meta')
  if (viewErr) {
    console.log('  Note: refresh via RPC failed — run manually: REFRESH MATERIALIZED VIEW states_meta;')
  } else {
    console.log('  Done.')
  }

  console.log('\nSeed complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
