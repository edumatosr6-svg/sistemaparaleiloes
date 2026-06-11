-- Update the function to be security definer to bypass RLS for public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_data()
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    level INTEGER,
    points INTEGER,
    is_vip BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.full_name, 
        p.avatar_url, 
        p.level, 
        p.points, 
        p.is_vip, 
        p.created_at
    FROM public.profiles p;
END;
$$;

-- Ensure the view is using this function correctly
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT * FROM public.get_public_profile_data();

-- Grant access to the view and function
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_data() TO anon, authenticated;
