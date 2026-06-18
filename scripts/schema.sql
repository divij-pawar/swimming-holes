-- Run this in Supabase SQL editor before seeding

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS spots (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  canonical_name   TEXT NOT NULL,
  state            TEXT,
  state_abbr       CHAR(2),
  town             TEXT,
  park             TEXT,
  lat              DOUBLE PRECISION,
  lon              DOUBLE PRECISION,
  geog             GEOGRAPHY(Point, 4326)
    GENERATED ALWAYS AS (
      CASE WHEN lat IS NOT NULL AND lon IS NOT NULL
        THEN ST_MakePoint(lon, lat)::geography
        ELSE NULL
      END
    ) STORED,
  swimming_quality TEXT,
  is_waterfall     BOOLEAN DEFAULT FALSE,
  is_swimming_hole BOOLEAN DEFAULT FALSE,
  cost             TEXT,
  private_property BOOLEAN,
  rating           NUMERIC(3,1),
  description      TEXT,
  waterfall_type   TEXT,
  water_source     TEXT,
  sources          TEXT[],
  source_urls      TEXT[],
  search_vector    tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(canonical_name, '') || ' ' ||
      coalesce(town, '') || ' ' ||
      coalesce(park, '') || ' ' ||
      coalesce(state, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS town_centroids (
  id         SERIAL PRIMARY KEY,
  town       TEXT NOT NULL,
  state_abbr CHAR(2) NOT NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lon        DOUBLE PRECISION NOT NULL,
  geog       GEOGRAPHY(Point, 4326)
    GENERATED ALWAYS AS (ST_MakePoint(lon, lat)::geography) STORED,
  UNIQUE(town, state_abbr)
);

CREATE MATERIALIZED VIEW IF NOT EXISTS states_meta AS
SELECT
  state_abbr,
  state,
  COUNT(*)                                         AS total_count,
  COUNT(*) FILTER (WHERE is_swimming_hole)         AS swimming_count,
  COUNT(*) FILTER (WHERE is_waterfall)             AS waterfall_count,
  COUNT(*) FILTER (WHERE lat IS NOT NULL)          AS has_gps_count,
  AVG(lat)                                         AS centroid_lat,
  AVG(lon)                                         AS centroid_lon
FROM spots
GROUP BY state_abbr, state;

CREATE UNIQUE INDEX IF NOT EXISTS states_meta_abbr_idx ON states_meta(state_abbr);

-- Indexes on spots
CREATE INDEX IF NOT EXISTS spots_state_idx   ON spots(state_abbr);
CREATE INDEX IF NOT EXISTS spots_quality_idx ON spots(swimming_quality);
CREATE INDEX IF NOT EXISTS spots_type_idx    ON spots(is_waterfall, is_swimming_hole);
CREATE INDEX IF NOT EXISTS spots_cost_idx    ON spots(cost);
CREATE INDEX IF NOT EXISTS spots_private_idx ON spots(private_property);
CREATE INDEX IF NOT EXISTS spots_geog_idx    ON spots USING GIST(geog);
CREATE INDEX IF NOT EXISTS spots_search_idx  ON spots USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS spots_rating_idx  ON spots(rating DESC NULLS LAST);

-- RPC to refresh materialized view (called by seed script)
CREATE OR REPLACE FUNCTION refresh_states_meta()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY states_meta;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- Even though the API uses the service role key (bypasses RLS),
-- enabling RLS means a leaked anon key cannot read the data at all.
-- The service role key remains the only path to the data.
-- ─────────────────────────────────────────────────────────

ALTER TABLE spots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE town_centroids ENABLE ROW LEVEL SECURITY;

-- No public anon access — all reads go through the service role key
-- via server-side API routes. If you ever want to allow direct Supabase
-- client reads (e.g., for a future mobile app), add a policy here.
-- For now: deny everything to anon/authenticated roles.

-- Deny anon reads (default when RLS is on with no policies)
-- (No CREATE POLICY needed — absence of policies = no access)

-- Allow only the service role to read/write (it bypasses RLS automatically)
-- This is enforced by Supabase's architecture: service role ≠ anon role.

-- ─────────────────────────────────────────────────────────
-- ADDITIONAL HARDENING: hide search_vector from API responses
-- The search_vector column contains all text concatenated —
-- revoke SELECT on it from the anon role as defense-in-depth.
-- ─────────────────────────────────────────────────────────
REVOKE SELECT ON spots FROM anon, authenticated;
REVOKE SELECT ON town_centroids FROM anon, authenticated;
-- Grant back only what's needed if you add anon policies later:
-- GRANT SELECT (id, slug, canonical_name, ...) ON spots TO anon;
