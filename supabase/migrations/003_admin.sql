-- Admin features migration
-- Adds is_admin, is_banned to profiles and grants admin RLS policies.

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false NOT NULL;

-- Helper: check if the calling user is an admin.
-- SECURITY DEFINER bypasses RLS so this never recurses.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Mark the initial admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'alexis.blas@me.com';

-- Trails: admins can delete any trail
CREATE POLICY "Admins can delete trails"
  ON public.trails FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Trail reports: admins can delete any report
-- (non-admins are already covered by the existing own-row policy)
CREATE POLICY "Admins can delete any trail report"
  ON public.trail_reports FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Profiles: admins can update any profile (ban / promote)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());
