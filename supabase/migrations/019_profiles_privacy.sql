-- Profiles must not expose emails (or any row) to anonymous visitors or
-- other signed-in users. Own row + admin full access only.

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
CREATE POLICY "Users can select own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can select any profile" ON public.profiles;
CREATE POLICY "Admins can select any profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());
