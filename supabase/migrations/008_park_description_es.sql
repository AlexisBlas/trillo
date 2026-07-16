-- Bilingual park descriptions
-- 2026-07-15

ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS description_es TEXT;
