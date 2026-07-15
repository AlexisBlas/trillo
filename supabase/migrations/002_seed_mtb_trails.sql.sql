-- Puerto Rico mountain bike trails (sourced from Trailforks + local riding maps).
-- Run this in the Supabase SQL editor. Safe to re-run thanks to ON CONFLICT.

INSERT INTO trails (name, location, description, qr_code) VALUES
  -- Bosque Cambalache (Arecibo) — the most popular MTB zone on the island
  ('Cambalache - La Joya',          'Bosque Cambalache, Arecibo',     'Flowy singletrack through karst forest; intermediate.',                'TRAIL_CAMB_LAJOYA'),
  ('Cambalache - Las Vacas',        'Bosque Cambalache, Arecibo',     'Punchy climbs and twisty descents under dense canopy.',                'TRAIL_CAMB_LASVACAS'),
  ('Cambalache - El Pasto',         'Bosque Cambalache, Arecibo',     'Open pasture connector with rolling terrain.',                         'TRAIL_CAMB_ELPASTO'),
  ('Cambalache - La Mosca',         'Bosque Cambalache, Arecibo',     'Technical XC loop with roots and limestone features.',                 'TRAIL_CAMB_LAMOSCA'),
  ('Cambalache - La S',             'Bosque Cambalache, Arecibo',     'Tight S-bends and short steep climbs.',                                'TRAIL_CAMB_LAS'),
  ('Cambalache - La Bajadita',      'Bosque Cambalache, Arecibo',     'Fast descent line connecting the upper loops.',                        'TRAIL_CAMB_BAJADITA'),
  ('Cambalache - El Cementerio',    'Bosque Cambalache, Arecibo',     'Rocky technical singletrack near the south boundary.',                 'TRAIL_CAMB_CEMENTERIO'),

  -- Vega Alta / Cerro Gordo
  ('Cerro Gordo - Main Loop',       'Vega Alta',                      'Coastal pine-forest XC loop popular with locals.',                     'TRAIL_CERROGORDO_MAIN'),
  ('Cerro Gordo - Beach Connector', 'Vega Alta',                      'Sandy doubletrack linking the forest to the coastline.',               'TRAIL_CERROGORDO_BEACH'),

  -- San Juan metro
  ('Bosque San Patricio Loop',      'Guaynabo',                       'Urban forest loop with short technical climbs.',                       'TRAIL_SANPATRICIO'),
  ('Piñones Boardwalk + Singletrack','Loíza',                         'Mangrove paseo with optional sandy singletrack offshoots.',            'TRAIL_PINONES'),

  -- Guajataca State Forest
  ('Guajataca - Vereda Interpretativa','Bosque Estatal de Guajataca, Quebradillas','Karst caves and sinkholes; technical XC.',               'TRAIL_GUAJATACA_VEREDA'),
  ('Guajataca - Tunel Loop',        'Bosque Estatal de Guajataca, Quebradillas','Old railroad tunnel descent loop.',                          'TRAIL_GUAJATACA_TUNEL'),

  -- Maricao State Forest (high elevation)
  ('Maricao - Monte del Estado',    'Bosque Estatal de Maricao, Maricao','High-altitude singletrack with sustained climbs and views.',        'TRAIL_MARICAO_MONTE'),
  ('Maricao - Las Cruces',          'Bosque Estatal de Maricao, Maricao','Steep technical descent line.',                                     'TRAIL_MARICAO_CRUCES'),

  -- Toro Negro
  ('Toro Negro - Doña Juana Loop',  'Bosque Estatal de Toro Negro, Orocovis','Cool cloud-forest XC at one of PR''s highest points.',          'TRAIL_TORONEGRO_DJUANA'),

  -- Susúa
  ('Susúa - Río Loco Loop',         'Bosque Estatal de Susúa, Yauco',  'River-crossing XC with rocky tech sections.',                          'TRAIL_SUSUA_RIOLOCO'),

  -- Guánica dry forest
  ('Guánica - Ballena Trail',       'Bosque Estatal de Guánica, Guánica','Exposed dry-forest singletrack with ocean views.',                  'TRAIL_GUANICA_BALLENA'),
  ('Guánica - Fuerte Caprón',       'Bosque Estatal de Guánica, Guánica','Climb to historic fort with rocky reward descent.',                 'TRAIL_GUANICA_CAPRON'),

  -- South / east
  ('Carite - Charco Azul XC',       'Bosque Estatal de Carite, Patillas','Shaded XC loop near the swimming hole.',                            'TRAIL_CARITE_CHARCO'),
  ('Tetas de Cayey - Ridge Line',   'Cayey',                          'Exposed ridge climb with twin-peak summit views.',                     'TRAIL_TETAS_CAYEY'),

  -- West coast freeride
  ('Rincón - Pico Atalaya',         'Rincón',                         'Punchy climb to lookout with flowy descent back to town.',             'TRAIL_RINCON_ATALAYA'),

  -- Monagas Trail Network (Parque Julio E. Monagas, Bayamón) — Metro PR's busiest MTB hub
  ('Monagas - Las Tablas',          'Parque Julio E. Monagas, Bayamón','Green/beginner flow trail with berms; ~4,829 ft, minimal climbing.',  'TRAIL_MONAGAS_LASTABLAS'),
  ('Monagas - Tres Palmas',         'Parque Julio E. Monagas, Bayamón','Blue downhill-only singletrack, ~1,188 ft point-to-point.',           'TRAIL_MONAGAS_TRESPALMAS'),
  ('Monagas - La Babilla',          'Parque Julio E. Monagas, Bayamón','Double black diamond DH; short, steep, all-mountain.',                'TRAIL_MONAGAS_LABABILLA'),
  ('Monagas - Boys Scouts',         'Parque Julio E. Monagas, Bayamón','Classic XC singletrack through the network''s core.',                 'TRAIL_MONAGAS_BOYSCOUTS'),
  ('Monagas - Billy the Kid',       'Parque Julio E. Monagas, Bayamón','Twisty intermediate singletrack with rolling features.',              'TRAIL_MONAGAS_BILLYKID'),
  ('Monagas - Los Almendros',       'Parque Julio E. Monagas, Bayamón','Locally famous flow line under almond canopy.',                       'TRAIL_MONAGAS_ALMENDROS'),
  ('Monagas - Hobbits',             'Parque Julio E. Monagas, Bayamón','Tight, low-clearance singletrack — duck and weave.',                  'TRAIL_MONAGAS_HOBBITS'),
  ('Monagas - Los Columpios',       'Parque Julio E. Monagas, Bayamón','Rolling jump-line style trail with swooping turns.',                  'TRAIL_MONAGAS_COLUMPIOS'),
  ('Monagas - Blair Witch',         'Parque Julio E. Monagas, Bayamón','Dark, rooty technical singletrack through dense forest.',             'TRAIL_MONAGAS_BLAIRWITCH'),
  ('Monagas - Los Picapiedras',     'Parque Julio E. Monagas, Bayamón','Short, fast, chunky descent with optional drop at the finish.',       'TRAIL_MONAGAS_PICAPIEDRAS'),
  ('Monagas - Fire Road (Sta. Ana)','Parque Julio E. Monagas, Bayamón','Wide fire road from the Santa Ana parking; main access/connector.',   'TRAIL_MONAGAS_FIREROAD')
ON CONFLICT (name) DO NOTHING;
