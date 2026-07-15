-- Bugbot fixes: schema alignment + tighter RLS
-- 2026-07-15

-- ─── Trails: difficulty column used by admin park/trail flows ────────────────
ALTER TABLE public.trails
  ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- ─── Parks: city + description used by admin + public UI ─────────────────────
ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── Trail reports: support park-level reports ───────────────────────────────
ALTER TABLE public.trail_reports
  ALTER COLUMN trail_id DROP NOT NULL;

ALTER TABLE public.trail_reports
  ADD COLUMN IF NOT EXISTS park_name TEXT;

CREATE INDEX IF NOT EXISTS idx_trail_reports_park_name
  ON public.trail_reports(park_name);

-- At least one of trail_id or park_name must be set
ALTER TABLE public.trail_reports
  DROP CONSTRAINT IF EXISTS trail_reports_trail_or_park_check;

ALTER TABLE public.trail_reports
  ADD CONSTRAINT trail_reports_trail_or_park_check
  CHECK (trail_id IS NOT NULL OR park_name IS NOT NULL);

-- ─── RLS: trails — only admins can write ─────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert trails" ON public.trails;
DROP POLICY IF EXISTS "Authenticated users can update trails" ON public.trails;

CREATE POLICY "Admins can insert trails"
  ON public.trails FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update trails"
  ON public.trails FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ─── RLS: trail_reports — prevent user_id spoofing ───────────────────────────
DROP POLICY IF EXISTS "Anyone can insert trail reports" ON public.trail_reports;
DROP POLICY IF EXISTS "Authenticated users can insert trail reports" ON public.trail_reports;

-- Anonymous inserts must leave user_id null; authenticated must use own uid
CREATE POLICY "Users can insert trail reports as themselves"
  ON public.trail_reports FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admins can update any report (moderation)
DROP POLICY IF EXISTS "Admins can update any trail report" ON public.trail_reports;

CREATE POLICY "Admins can update any trail report"
  ON public.trail_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin());
