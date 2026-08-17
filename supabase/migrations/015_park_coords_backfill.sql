-- Backfill parks.lat/lng from curated trailhead/parking coordinates.
-- Does not overwrite parks that already have both lat and lng set.
-- Requires 014_park_coords.sql.
--
-- Palmas MTB omitted: provided coords pointed at Vega Baja (Cibuco/Palmas), not Humacao.

CREATE TEMP TABLE park_coord_seed (
  name TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

INSERT INTO park_coord_seed (name, city, lat, lng) VALUES
  ('Algarrobo MTB', 'San Juan', 18.38220, -66.02019),
  ('Barranquitas MTB', 'Barranquitas', 18.19166, -66.30760),
  ('Bosque Cambalache', 'Arecibo', 18.45257, -66.59713),
  ('Bosque Cambalache, Arecibo', 'Arecibo', 18.45257, -66.59713),
  ('Bosque Estatal de Carite, Patillas', 'Patillas', 18.10010, -66.09950),
  ('Bosque Estatal de Guajataca, Quebradillas', 'Quebradillas', 18.41349, -66.97748),
  ('Bosque Estatal de Guánica, Guánica', 'Guánica', 17.94369, -66.87080),
  ('Bosque Estatal de Maricao, Maricao', 'Maricao', 18.16100, -66.99800),
  ('Bosque Estatal de Susúa, Yauco', 'Yauco', 18.07700, -66.90601),
  ('Bosque Estatal de Toro Negro, Orocovis', 'Orocovis', 18.17342, -66.49231),
  ('Cabo Rojo Bike Trail', 'Cabo Rojo', 17.98620, -67.19570),
  ('Capaez MTB Trail', 'Hatillo', 18.45497, -66.81056),
  ('Cayey', 'Cayey', 18.11190, -66.16600),
  ('Cerro Gordo', 'Vega Alta', 18.49100, -66.35100),
  ('Cerro Gordo, Vega Alta', 'Vega Alta', 18.49100, -66.35100),
  ('Comeré', 'Ponce', 18.06500, -66.65000),
  ('El Desvío MTB Trail', 'Villalba', 18.12700, -66.48700),
  ('El Ferial MTB Trail', 'Ponce', 18.06000, -66.61500),
  ('El Yunque National Forest', 'Río Grande', 18.30700, -65.78300),
  ('Fajardo MTB', 'Fajardo', 18.32800, -65.65500),
  ('Guajataka Forest Reserve', 'Isabela', 18.41401, -66.97474),
  ('Guánica', 'Guánica', 17.94369, -66.87080),
  ('Guaniquilla MTB Trail', 'Cabo Rojo', 18.01000, -67.17600),
  ('Guaynabo', 'Guaynabo', 18.36100, -66.11300),
  ('Hacienda La Esperanza MTB Trail', 'Manatí', 18.46740, -66.51560),
  ('Hoyo 8 MTB Park', 'Aguadilla', 18.43400, -67.15400),
  ('Loíza', 'Loíza', 18.43200, -65.88000),
  ('Los Pinchos', 'Salinas', 18.03061, -66.24423),
  ('Los Tubos', 'Manatí', 18.46490, -66.47511),
  ('Los Tubos, Manati', 'Manatí', 18.46490, -66.47511),
  ('Moca MTB Park', 'Moca', 18.39400, -67.11400),
  ('Monte Brujo', 'Guayama', 18.01700, -66.19000),
  ('Monte Pirata', 'Cabo Rojo', 18.02000, -67.17000),
  ('Monte Realengo', 'Toa Alta', 18.39650, -66.22668),
  ('Parque Julio E. Monagas', 'Bayamón', 18.36800, -66.15500),
  ('Parque Julio E. Monagas, Bayamón', 'Bayamón', 18.36800, -66.15500),
  ('Pepino MTB Trail', 'San Sebastián', 18.34846, -66.98727),
  ('Puerto Hermina MTB', 'Quebradillas', 18.48073, -66.91010),
  ('Rincón', 'Rincón', 18.34000, -67.25000),
  ('Salinas Gravity Park', 'Salinas', 18.02217, -66.23666),
  ('San Germán MTB', 'San Germán', 18.07137, -67.03628),
  ('Toro Negro Forest', 'Orocovis', 18.17342, -66.49231),
  ('Tortuguero', 'Vega Baja', 18.44600, -66.40400),
  ('Vega Alta', 'Vega Alta', 18.41200, -66.33100);

UPDATE public.parks p
SET
  lat = s.lat,
  lng = s.lng,
  city = COALESCE(NULLIF(trim(p.city), ''), s.city)
FROM park_coord_seed s
WHERE p.name = s.name
  AND (p.lat IS NULL OR p.lng IS NULL);

INSERT INTO public.parks (name, city, lat, lng, is_hidden)
SELECT s.name, s.city, s.lat, s.lng, false
FROM park_coord_seed s
WHERE NOT EXISTS (SELECT 1 FROM public.parks p WHERE p.name = s.name)
ON CONFLICT (name) DO NOTHING;

DROP TABLE park_coord_seed;
