-- Expand park regions to the full island classification:
-- north, metro, east, central, mountain, west, southwest, south.

ALTER TABLE public.parks
  DROP CONSTRAINT IF EXISTS parks_region_check;

ALTER TABLE public.parks
  ADD CONSTRAINT parks_region_check
  CHECK (
    region IS NULL OR region IN (
      'north',
      'metro',
      'east',
      'central',
      'mountain',
      'west',
      'southwest',
      'south'
    )
  );

COMMENT ON COLUMN public.parks.region IS
  'Island region: north, metro, east, central, mountain, west, southwest, or south.';

-- Ensure normalize helper exists (created in 012).
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

-- Re-backfill every park from the updated municipality map.
WITH municipality_region(city_key, region) AS (
  VALUES
    -- North
    ('arecibo', 'north'),
    ('barceloneta', 'north'),
    ('camuy', 'north'),
    ('ciales', 'north'),
    ('dorado', 'north'),
    ('florida', 'north'),
    ('hatillo', 'north'),
    ('manati', 'north'),
    ('morovis', 'north'),
    ('quebradillas', 'north'),
    ('toa alta', 'north'),
    ('toa baja', 'north'),
    ('vega alta', 'north'),
    ('vega baja', 'north'),
    -- Metro
    ('bayamon', 'metro'),
    ('catano', 'metro'),
    ('guaynabo', 'metro'),
    ('san juan', 'metro'),
    ('trujillo alto', 'metro'),
    ('carolina', 'metro'),
    ('loiza', 'metro'),
    -- East
    ('canovanas', 'east'),
    ('ceiba', 'east'),
    ('fajardo', 'east'),
    ('humacao', 'east'),
    ('juncos', 'east'),
    ('las piedras', 'east'),
    ('luquillo', 'east'),
    ('maunabo', 'east'),
    ('naguabo', 'east'),
    ('rio grande', 'east'),
    ('san lorenzo', 'east'),
    ('vieques', 'east'),
    ('culebra', 'east'),
    ('yabucoa', 'east'),
    -- Central
    ('aguas buenas', 'central'),
    ('barranquitas', 'central'),
    ('cidra', 'central'),
    ('comerio', 'central'),
    ('corozal', 'central'),
    ('naranjito', 'central'),
    ('orocovis', 'central'),
    ('caguas', 'central'),
    ('gurabo', 'central'),
    ('aibonito', 'central'),
    ('cayey', 'central'),
    -- Mountain
    ('adjuntas', 'mountain'),
    ('jayuya', 'mountain'),
    ('lares', 'mountain'),
    ('maricao', 'mountain'),
    ('utuado', 'mountain'),
    -- West
    ('aguada', 'west'),
    ('aguadilla', 'west'),
    ('anasco', 'west'),
    ('hormigueros', 'west'),
    ('isabela', 'west'),
    ('lajas', 'west'),
    ('las marias', 'west'),
    ('mayaguez', 'west'),
    ('moca', 'west'),
    ('rincon', 'west'),
    ('sabana grande', 'west'),
    ('san german', 'west'),
    ('san sebastian', 'west'),
    ('cabo rojo', 'west'),
    -- Southwest
    ('guanica', 'southwest'),
    ('guayanilla', 'southwest'),
    ('penuelas', 'southwest'),
    ('ponce', 'southwest'),
    ('yauco', 'southwest'),
    -- South
    ('arroyo', 'south'),
    ('coamo', 'south'),
    ('guayama', 'south'),
    ('juana diaz', 'south'),
    ('patillas', 'south'),
    ('salinas', 'south'),
    ('santa isabel', 'south'),
    ('villalba', 'south')
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
)
UPDATE public.parks p
SET region = r.region
FROM resolved r
WHERE p.name = r.name
  AND r.region IS NOT NULL;
