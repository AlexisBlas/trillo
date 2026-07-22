-- Allow admins to fully delete registered users (auth.users + cascaded profile/follows).
-- Preserve trail reports by anonymizing them instead of cascading deletes.

-- trail_reports.user_id was originally ON DELETE CASCADE; switch to SET NULL
-- so historical conditions stay on the map after an account is removed.
ALTER TABLE public.trail_reports
  DROP CONSTRAINT IF EXISTS trail_reports_user_id_fkey;

ALTER TABLE public.trail_reports
  ADD CONSTRAINT trail_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE id = target_id AND is_admin = true
  ) AND (
    SELECT count(*)::int FROM public.profiles WHERE is_admin = true
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot delete the last admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
