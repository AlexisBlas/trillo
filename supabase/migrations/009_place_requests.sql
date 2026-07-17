-- User requests to add a park or trail (shown in admin dashboard).

CREATE TABLE IF NOT EXISTS public.place_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN ('park', 'trail')),
  name TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_requests_status_created
  ON public.place_requests (status, created_at DESC);

CREATE TRIGGER update_place_requests_updated_at
  BEFORE UPDATE ON public.place_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.place_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (guest or signed-in) can submit a request
CREATE POLICY "Anyone can insert place requests"
  ON public.place_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can read / update / delete
CREATE POLICY "Admins can select place requests"
  ON public.place_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update place requests"
  ON public.place_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete place requests"
  ON public.place_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.place_requests TO authenticated;
GRANT INSERT ON public.place_requests TO anon;
