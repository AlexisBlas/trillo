-- Allow anonymous (unauthenticated) report submissions by making user_id optional.
ALTER TABLE public.trail_reports ALTER COLUMN user_id DROP NOT NULL;

-- Unauthenticated users can now insert reports (no user_id required)
DROP POLICY IF EXISTS "Authenticated users can insert trail reports" ON public.trail_reports;

CREATE POLICY "Anyone can insert trail reports"
  ON public.trail_reports FOR INSERT
  WITH CHECK (true);
