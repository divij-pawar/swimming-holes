export type SwimmingQuality =
  | 'Outstanding'
  | 'Excellent'
  | 'Good'
  | 'Yes'
  | 'Fair'
  | 'Poor'
  | 'No'
  | string

export interface SpotSummary {
  id: number
  slug: string
  canonical_name: string
  state: string | null
  state_abbr: string | null
  town: string | null
  park: string | null
  lat: number | null
  lon: number | null
  swimming_quality: SwimmingQuality | null
  is_waterfall: boolean
  is_swimming_hole: boolean
  cost: string | null
  private_property: boolean | null
  rating: number | null
  waterfall_type: string | null
  // present in near-me results
  dist_km?: number
  is_approximate?: boolean
}

export interface SpotFull extends SpotSummary {
  description: string | null
  water_source: string | null
  sources: string[] | null
  source_urls: string[] | null
}

export interface StateMeta {
  state_abbr: string
  state: string
  total_count: number
  swimming_count: number
  waterfall_count: number
  centroid_lat: number | null
  centroid_lon: number | null
}

export interface SpotsResponse {
  data?: SpotSummary[]
  total?: number
  has_more?: boolean
  error?: string
}
