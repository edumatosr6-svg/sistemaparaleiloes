
-- 1. PROFILES: hide sensitive columns from public
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Public-safe view exposing only non-sensitive columns
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT id, full_name, avatar_url, level, points, is_vip, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. COUPONS: require authentication to list
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;

CREATE POLICY "Authenticated users can view coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (true);

-- 3. SYSTEM_SETTINGS: remove the overly-permissive duplicate policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;
