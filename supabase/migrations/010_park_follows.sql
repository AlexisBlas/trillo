-- Park follows (favorites) — keyed by park name string used across the app.

CREATE TABLE IF NOT EXISTS public.park_follows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  park_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, park_name)
);

CREATE INDEX IF NOT EXISTS idx_park_follows_user_created
  ON public.park_follows (user_id, created_at DESC);

ALTER TABLE public.park_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own park follows"
  ON public.park_follows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own park follows"
  ON public.park_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own park follows"
  ON public.park_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.park_follows TO authenticated;
