-- Parks visibility table.
-- Stores park-level metadata keyed by the location string used in trails.location.

CREATE TABLE IF NOT EXISTS public.parks (
  name TEXT PRIMARY KEY,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.parks ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed so the public app can filter hidden parks)
CREATE POLICY "Parks are viewable by everyone"
  ON public.parks FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admins can insert parks"
  ON public.parks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update parks"
  ON public.parks FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete parks"
  ON public.parks FOR DELETE
  TO authenticated
  USING (public.is_admin());
