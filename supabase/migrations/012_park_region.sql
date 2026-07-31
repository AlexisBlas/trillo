-- Park geographic region for list filters (north / east / south / west / metro).
-- Source of truth is parks.region; city→region map is only used for backfill defaults.

ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS region TEXT;

ALTER TABLE public.parks
  DROP CONSTRAINT IF EXISTS parks_region_check;

ALTER TABLE public.parks
  ADD CONSTRAINT parks_region_check
  CHECK (region IS NULL OR region IN ('north', 'east', 'south', 'west', 'metro'));

COMMENT ON COLUMN public.parks.region IS
  'Island region for park filters: north, east, south, west, or metro.';

-- Normalize accents for municipality matching (no unaccent extension required).
CREATE OR REPLACE FUNCTION public.trillo_normalize_place(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(
      lower(
        translate(
          coalesce(input, ''),
          'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaaeeeeiiiiooooouuuuncaaaaaaeeeeiiiiooooouuuunc'
        )
      )
    ),
    ''
  );
$$;

-- Backfill region from city (or park-name suffix) using municipality map.
WITH municipality_region(city_key, region) AS (
  VALUES
    -- Metro
    ('san juan', 'metro'),
    ('bayamon', 'metro'),
    ('guaynabo', 'metro'),
    ('carolina', 'metro'),
    ('trujillo alto', 'metro'),
    ('catano', 'metro'),
    ('toa baja', 'metro'),
    ('toa alta', 'metro'),
    ('dorado', 'metro'),
    ('loiza', 'metro'),
    ('canovanas', 'metro'),
    ('aguas buenas', 'metro'),
    ('gurabo', 'metro'),
    ('caguas', 'metro'),
    -- North
    ('arecibo', 'north'),
    ('camuy', 'north'),
    ('hatillo', 'north'),
    ('quebradillas', 'north'),
    ('isabela', 'north'),
    ('barceloneta', 'north'),
    ('manati', 'north'),
    ('vega alta', 'north'),
    ('vega baja', 'north'),
    ('florida', 'north'),
    ('ciales', 'north'),
    ('morovis', 'north'),
    ('corozal', 'north'),
    ('naranjito', 'north'),
    ('utuado', 'north'),
    ('lares', 'north'),
    ('orocovis', 'north'),
    -- East
    ('fajardo', 'east'),
    ('ceiba', 'east'),
    ('naguabo', 'east'),
    ('humacao', 'east'),
    ('yabucoa', 'east'),
    ('maunabo', 'east'),
    ('las piedras', 'east'),
    ('juncos', 'east'),
    ('san lorenzo', 'east'),
    ('cayey', 'east'),
    ('patillas', 'east'),
    ('luquillo', 'east'),
    ('rio grande', 'east'),
    ('vieques', 'east'),
    ('culebra', 'east'),
    ('arroyo', 'east'),
    ('guayama', 'east'),
    ('cidra', 'east'),
    ('aibonito', 'east'),
    ('barranquitas', 'east'),
    ('comerio', 'east'),
    -- South
    ('ponce', 'south'),
    ('salinas', 'south'),
    ('santa isabel', 'south'),
    ('juana diaz', 'south'),
    ('coamo', 'south'),
    ('guanica', 'south'),
    ('yauco', 'south'),
    ('guayanilla', 'south'),
    ('penuelas', 'south'),
    ('villalba', 'south'),
    ('adjuntas', 'south'),
    ('jayuya', 'south'),
    ('sabana grande', 'south'),
    -- West
    ('mayaguez', 'west'),
    ('aguadilla', 'west'),
    ('aguada', 'west'),
    ('rincon', 'west'),
    ('cabo rojo', 'west'),
    ('lajas', 'west'),
    ('san german', 'west'),
    ('hormigueros', 'west'),
    ('anasco', 'west'),
    ('moca', 'west'),
    ('san sebastian', 'west'),
    ('las marias', 'west'),
    ('maricao', 'west')
),
resolved AS (
  SELECT
    p.name,
    (
      SELECT m.region
      FROM municipality_region m
      WHERE
        public.trillo_normalize_place(p.city) = m.city_key
        OR public.trillo_normalize_place(p.city) LIKE '%' || m.city_key || '%'
        OR public.trillo_normalize_place(
          CASE
            WHEN strpos(p.name, ',') > 0
              THEN trim(substring(p.name from strpos(p.name, ',') + 1))
            ELSE NULL
          END
        ) = m.city_key
        OR public.trillo_normalize_place(p.name) LIKE '%' || m.city_key || '%'
      ORDER BY
        CASE
          WHEN public.trillo_normalize_place(p.city) = m.city_key THEN 0
          WHEN public.trillo_normalize_place(
            CASE
              WHEN strpos(p.name, ',') > 0
                THEN trim(substring(p.name from strpos(p.name, ',') + 1))
              ELSE NULL
            END
          ) = m.city_key THEN 1
          ELSE 2
        END,
        char_length(m.city_key) DESC
      LIMIT 1
    ) AS region
  FROM public.parks p
  WHERE p.region IS NULL
)
UPDATE public.parks p
SET region = r.region
FROM resolved r
WHERE p.name = r.name
  AND r.region IS NOT NULL
  AND p.region IS NULL;
