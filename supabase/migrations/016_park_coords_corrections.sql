-- Correct park coordinates that were several km off the actual trails.
-- Verified against OpenStreetMap (named MTB paths and adjacent parking).
-- Overwrites existing values; used by the Directions button and rain estimates.

WITH fix(name, lat, lng) AS (
  VALUES
    -- Public parking inside Parque Nacional Julio Enrique Monagas (was ~4.6 km south)
    ('Parque Julio E. Monagas', 18.40914, -66.14125),
    ('Parque Julio E. Monagas, Bayamón', 18.40914, -66.14125),
    -- Parking beside Cerro Gordo MTB Trail (was offshore, ~2 km)
    ('Cerro Gordo', 18.48288, -66.33610),
    ('Cerro Gordo, Vega Alta', 18.48288, -66.33610),
    -- Parking beside Sendero BTT Fajardo (was ~1.9 km)
    ('Fajardo MTB', 18.33940, -65.66953),
    -- OSM path "Comere", Sabanetas, Ponce (was ~9 km)
    ('Comeré', 18.02451, -66.57606),
    -- OSM path "Monte Pirata MTB Trail", Guanajibo, Cabo Rojo (was ~16 km)
    ('Monte Pirata', 18.16414, -67.18426)
)
UPDATE public.parks p
SET
  lat = f.lat::double precision,
  lng = f.lng::double precision
FROM fix f
WHERE p.name = f.name;
