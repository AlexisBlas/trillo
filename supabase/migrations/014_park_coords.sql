-- Optional park coordinates for rainfall-based condition estimates.
-- When unset, the app falls back to municipality centroids from city.

ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

COMMENT ON COLUMN public.parks.lat IS
  'Optional park latitude (WGS84). Used for Open-Meteo precip estimates.';
COMMENT ON COLUMN public.parks.lng IS
  'Optional park longitude (WGS84). Used for Open-Meteo precip estimates.';
