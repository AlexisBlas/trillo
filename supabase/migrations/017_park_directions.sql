-- Admin-curated directions target for the park Directions button.
-- Accepts a maps link (https://…) or "lat, lng". When unset, the button is hidden.

ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS directions_url TEXT;

COMMENT ON COLUMN public.parks.directions_url IS
  'Maps link or "lat, lng" for park directions. Null hides the Directions button.';
