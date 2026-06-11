-- Ensure anonymous visitors can read public site config from system_settings.
-- This re-applies the policy from 20260512234546 in case it was never
-- applied to production (we saw 401s for system_settings on plataformaleiloesagro.site).
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings') THEN
    -- Make sure RLS is on
    EXECUTE 'ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY';

    -- Drop and recreate the anon-readable SELECT policy
    DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
    CREATE POLICY "Anyone can view settings"
      ON public.system_settings
      FOR SELECT
      USING (true);
  END IF;
END
$$;
