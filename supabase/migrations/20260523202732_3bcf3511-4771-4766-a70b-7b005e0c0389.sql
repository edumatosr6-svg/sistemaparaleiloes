-- Create a security definer function to fetch public profile data bypassing RLS
CREATE OR REPLACE FUNCTION public.get_public_profile_data()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    level INTEGER,
    points INTEGER,
    is_vip BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, full_name, avatar_url, level, points, is_vip, created_at
    FROM public.profiles;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_public_profile_data() TO public;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data() TO authenticated;

-- Redefine the profiles_public view to use the security definer function
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT * FROM public.get_public_profile_data();

-- Ensure public access to the view
GRANT SELECT ON public.profiles_public TO public;
GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Update system_settings policies to ensure public keys are always readable
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.system_settings;
CREATE POLICY "Public settings are viewable by everyone" 
ON public.system_settings 
FOR SELECT 
TO public 
USING (key = ANY (ARRAY['site_config', 'mercadopago_public_key']));

-- Ensure admins can still see everything
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" 
ON public.system_settings 
FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());
